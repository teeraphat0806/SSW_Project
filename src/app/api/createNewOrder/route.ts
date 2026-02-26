import { randomBytes } from "crypto";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { ShapeSteel } from "@/types";

// ✅ สร้าง type จาก Zod เพื่อกัน implicit any ทั้งไฟล์
type CreateNewOrderInput = z.infer<typeof CreateNewOrderSchema>;
type OrderPOInput = CreateNewOrderInput["orderPO"];
type ProductInput = OrderPOInput["products"][number];

function generateCode(
  length = 20,
  charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",
) {
  if (length <= 0) return "";
  const n = charset.length;
  if (n < 2) throw new Error("charset ต้องมีอักขระอย่างน้อย 2 ตัว");

  const bytes: Uint8Array = randomBytes(length * 2);
  const result: string[] = [];
  const max = 256 - (256 % n);

  let i = 0;
  while (result.length < length) {
    if (i >= bytes.length) {
      const more = randomBytes(length);
      const tmp = new Uint8Array(more);
      for (let j = 0; j < tmp.length; j++) bytes[i + j] = tmp[j];
    }
    const rnd = bytes[i++]!;
    if (rnd < max) result.push(charset[rnd % n]!);
  }
  return result.join("");
}

type SteelFromDB = {
  id: number;
  codeSteel: string;
  price: number;
  density: number;
  shape: ShapeSteel;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const steelKey = (codeSteel: string, shape: ShapeSteel) =>
  `${codeSteel}::${shape}`;
export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);
  if ("response" in authResult) return authResult.response;

  const { session } = authResult;

  try {
    const body = await req.json();

    const parsed = CreateNewOrderSchema.safeParse(body);
    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      console.log("Validation errors:", formattedErrors);
      return NextResponse.json(
        { error: "Invalid input", details: formattedErrors },
        { status: 400 },
      );
    }

    const data: CreateNewOrderInput = parsed.data;
    const po: OrderPOInput = data.orderPO;

    //  ดึงคู่ codeSteel + shape ทั้งหมดที่เกี่ยวข้อง
    const requestedSteels = Array.from(
      new Set(
        po.products.map((product: ProductInput) =>
          steelKey(
            String(product.steelType).trim(),
            product.shape as unknown as ShapeSteel,
          ),
        ),
      ),
    ).map((k) => {
      const [codeSteel, shape] = k.split("::");
      return {
        codeSteel: codeSteel ?? "",
        shape: (shape ?? "square") as ShapeSteel,
      };
    });

    const newBill = await prisma.$transaction(async (tx) => {
      const steelTypes = await tx.steelType.findMany({
        where: {
          OR: requestedSteels.map(({ codeSteel, shape }) => ({
            codeSteel,
            shape,
          })),
        },
        select: {
          id: true,
          codeSteel: true,
          price: true,
          density: true,
          shape: true,
        },
      });

      const mapSteel = new Map<string, SteelFromDB>(
        steelTypes.map((s) => [
          steelKey(s.codeSteel, s.shape as unknown as ShapeSteel),
          s,
        ]),
      );

      const missing = requestedSteels.filter(
        ({ codeSteel, shape }) => !mapSteel.has(steelKey(codeSteel, shape)),
      );
      if (missing.length)
        throw new Error(
          `SteelType not found: ${missing
            .map(({ codeSteel, shape }) => `${codeSteel} (${shape})`)
            .join(", ")}`,
        );

      // เตรียมข้อมูล
      const computed = po.products.map((product: ProductInput) => {
        const code = String(product.steelType).trim();
        const shape = product.shape as unknown as ShapeSteel;
        const steel = mapSteel.get(steelKey(code, shape))!;
        const linePrice = Number(product.price ?? steel.price);
        const lineWeight = product.weight ?? null;
        const lineDiscount = product.discount ?? null;

        const steelline = calculateWeightDetails({
          shape,
          amount: product.amount,
          width: product.wide ?? undefined,
          length: product.length,
          thickness: product.thickness,
          density: steel.density,

          price: linePrice,
          weight: lineWeight,
          total: null,
          discount: lineDiscount,

          isOD: product.isOD ?? false,
          isServices: product.isServices ?? false,
          isPerAmount: product.isPerAmount ?? false,
        });

        return {
          steel,
          product,
          steelline,
          linePrice,
          lineWeight,
          lineDiscount,
        };
      });

      const subtotal = round2(
        computed.reduce((sum: number, x) => sum + x.steelline.total, 0),
      );
      const discount = round2(
        computed.reduce(
          (sum: number, x) => sum + Number(x.lineDiscount ?? 0),
          0,
        ),
      );
      const subtotalAfterDiscount = round2(subtotal - discount);
      const vat = round2((subtotalAfterDiscount * 7) / 100);
      const grandTotal = round2(subtotalAfterDiscount + vat);

      const bill = await tx.bill.create({
        data: {
          Customer: { connect: { id: data.customerId } },
          codeCustomer: generateCode(),
          deliveryDate: new Date(data.deliveryDate),

          salesName: session.user?.name ?? "",
          Staff_Bill_salesNameToStaff: {
            connect: { id: Number(session.user?.id) },
          },

          subtotal,
          discount,
          vat,
          grandTotal,

          OrderPO: {
            create: {
              poNumber: po.poNumber ?? null,
              Customer: { connect: { id: data.customerId } },
              urlPo: po.urlPo ?? [],
              total: subtotal,

              Product: {
                create: computed.map(
                  (
                    {
                      steel,
                      product,
                      steelline,
                      linePrice,
                      lineWeight,
                      lineDiscount,
                    },
                    index,
                  ) => ({
                    SteelType: { connect: { id: steel.id } },
                    sequence: product.sequence ?? index + 1,

                    wide: product.wide ?? null,
                    length: product.length,
                    thickness: product.thickness,
                    amount: product.amount,

                    unitPrice: linePrice,
                    actualWeight: lineWeight,
                    discount: lineDiscount,
                    detail: product.detail ?? null,
                    job: product.job ?? null,
                    cuttingMethod: product.cuttingMethod ?? "normal",

                    isOD: product.isOD ?? false,
                    isServices: product.isServices ?? false,
                    isPerAmount: product.isPerAmount ?? false,
                    total: steelline.total, //  เป็น number แน่นอน
                  }),
                ),
              },
            },
          },
        },
        include: {
          Customer: true,
          OrderPO: { include: { Product: true } },
        },
      });

      return bill;
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
