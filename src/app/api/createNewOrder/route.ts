import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

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

const round2 = (n: number) => Math.round(n * 100) / 100;

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

type SteelShape = "square" | "line";

function calcComputedWeightKg(params: {
  shape: SteelShape;
  amount: number;
  width?: number | null;
  length: number;
  thickness: number;
  density: number;
}) {
  const amount = safeNum(params.amount);
  const width = safeNum(params.width);
  const length = safeNum(params.length);
  const thickness = safeNum(params.thickness);
  const density = safeNum(params.density) || 7860;

  if (amount <= 0 || length <= 0 || thickness <= 0) return 0;

  let weightPerPieceKg = 0;

  if (params.shape === "square") {
    if (width <= 0) return 0;
    const volume = width * length * thickness;
    weightPerPieceKg = volume * density * 0.1;
  } else {
    const volume = length * length * thickness;
    weightPerPieceKg = volume * density * 0.1;
  }

  return weightPerPieceKg * amount;
}

function calcLine(params: {
  amount: number;
  weight?: number | null;
  width?: number | null;
  length: number;
  thickness: number;
  steel: { price: number; density: number; shape: SteelShape };
}) {
  const price = safeNum(params.steel.price);
  const amount = safeNum(params.amount);
  const manualWeight = safeNum(params.weight);

  if (manualWeight > 0) {
    const totalWeightKg = manualWeight * amount;
    return {
      weightKg: round2(totalWeightKg),
      total: round2(totalWeightKg * price),
      isManual: true as const,
    };
  }

  const computedWeightKg = calcComputedWeightKg({
    shape: params.steel.shape,
    amount,
    width: params.width ?? null,
    length: params.length,
    thickness: params.thickness,
    density: params.steel.density,
  });

  return {
    weightKg: round2(computedWeightKg),
    total: round2(computedWeightKg * price),
    isManual: false as const,
  };
}

type SteelFromDB = {
  id: number;
  codeSteel: string;
  price: number;
  density: number;
  shape: "square" | "line";
};

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

    //  ดึง codeSteel ทั้งหมดที่เกี่ยวข้อง
    const allCodes = Array.from(
      new Set(
        po.products.map((product: ProductInput) =>
          String(product.steelType).trim(),
        ),
      ),
    );

    const newBill = await prisma.$transaction(async (tx) => {
      const steelTypes = await tx.steelType.findMany({
        where: { codeSteel: { in: allCodes } },
        select: {
          id: true,
          codeSteel: true,
          price: true,
          density: true,
          shape: true,
        },
      });

      const mapSteel = new Map<string, SteelFromDB>(
        steelTypes.map((s) => [s.codeSteel, s]),
      );

      const missing = allCodes.filter((c) => !mapSteel.has(c));
      if (missing.length)
        throw new Error(`SteelType not found: ${missing.join(", ")}`);

      // เตรียมข้อมูล
      const computed = po.products.map((product: ProductInput) => {
        const code = String(product.steelType).trim();
        const steel = mapSteel.get(code)!;

        const shape = steel.shape as unknown as SteelShape;

        const steelline = calcLine({
          amount: product.amount,
          width: product.wide ?? null,
          length: product.length,
          thickness: product.thickness,
          steel: { price: steel.price, density: steel.density, shape },
        });

        return { steel, product, steelline };
      });

      const poTotal = round2(
        computed.reduce((sum: number, x) => sum + x.steelline.total, 0),
      );

      const bill = await tx.bill.create({
        data: {
          Customer: { connect: { id: data.customerId } },
          yourRef: data.yourRef,
          codeCustomer: generateCode(),
          deliveryDate: new Date(data.deliveryDate),

          salesName: session.user?.name ?? "",
          Staff_Bill_salesNameToStaff: {
            connect: { id: Number(session.user?.id) },
          },

          subtotal: poTotal,
          vat: round2((poTotal * 7) / 100),
          grandTotal: round2(poTotal + (poTotal * 7) / 100),

          OrderPO: {
            create: {
              poNumber: po.poNumber ?? null,
              Customer: { connect: { id: data.customerId } },
              urlPo: po.urlPo ?? [],
              total: poTotal,

              Product: {
                create: computed.map(({ steel, product, steelline }) => ({
                  SteelType: { connect: { id: steel.id } },

                  wide: product.wide ?? null,
                  length: product.length,
                  thickness: product.thickness,
                  amount: product.amount,

                  unitPrice: steel.price, // ✅ snapshot ราคา ณ ตอนนั้น
                  detail: product.detail ?? null,
                  job: product.job ?? null,
                  cuttingMethod: product.cuttingMethod ?? "normal",

                  total: steelline.total, // ✅ เป็น number แน่นอน
                })),
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
