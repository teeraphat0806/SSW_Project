import { randomBytes } from "crypto";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { ShapeSteel } from "@/types";

/* =========================================================
   TYPE DEFINITIONS
========================================================= */

type CreateOrderInput = z.infer<typeof CreateNewOrderSchema>;
type OrderPO = CreateOrderInput["orderPO"];
type Product = OrderPO["products"][number];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

// ปัดเลขให้เหลือ 2 ตำแหน่ง
function round2(num: number) {
  return Math.round(num * 100) / 100;
}

// สร้าง key สำหรับ map เหล็ก
function createSteelKey(codeSteel: string, shape: ShapeSteel) {
  return `${codeSteel}::${shape}`;
}

// แปลงรายการเหล็กที่หาไม่เจอให้อ่านง่ายในข้อความ error
function formatMissingSteelMessage(
  missingSteels: Array<{ codeSteel: string; shape: ShapeSteel }>,
) {
  const text = missingSteels
    .map((item) => `${item.codeSteel} (${item.shape})`)
    .join(", ");

  return `SteelType not found: ${text}`;
}

// สร้างรหัสสุ่มสำหรับ bill
function generateCode(length = 20) {
  const charset =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

  const bytes = randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    const index = bytes[i]! % charset.length;
    result += charset[index];
  }

  return result;
}

/* =========================================================
   MAIN ROUTE
========================================================= */

export async function POST(req: NextRequest) {
  // 1️⃣ ตรวจสอบสิทธิ์ผู้ใช้
  const auth = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in auth) return auth.response;

  try {
    // 2️⃣ รับข้อมูลจาก request
    const body = await req.json();

    // 3️⃣ ตรวจสอบข้อมูลด้วย Zod
    const parsed = CreateNewOrderSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      }));

      return NextResponse.json(
        { error: "Invalid input", details: errors },
        { status: 400 },
      );
    }

    const data: CreateOrderInput = parsed.data;
    const orderPO: OrderPO = data.orderPO;

    // 4️⃣ เตรียมรายการเหล็กที่ต้องใช้
    const steelPairs = Array.from(
      new Set(
        orderPO.products.map((p) =>
          createSteelKey(
            String(p.steelType).trim(),
            p.shape as ShapeSteel,
          ),
        ),
      ),
    ).map((key) => {
      const [codeSteel, shape] = key.split("::");
      return {
        codeSteel: codeSteel!,
        shape: shape as ShapeSteel,
      };
    });

    // 5️⃣ เริ่ม transaction
    const newBill = await prisma.$transaction(async (tx) => {
      // ดึงเหล็กจาก database
      const steelList = await tx.steelType.findMany({
        where: { OR: steelPairs },
      });

      // สร้าง map ไว้ค้นหาเหล็กเร็ว ๆ
      const steelMap = new Map<
        string,
        typeof steelList[number]
      >();

      steelList.forEach((steel) => {
        const key = createSteelKey(
          steel.codeSteel,
          steel.shape as ShapeSteel,
        );
        steelMap.set(key, steel);
      });

      // 6️⃣ ตรวจว่ามีเหล็กรายการไหนที่หาไม่เจอบ้าง (รวมทุกตัว)
      const missingSteels = steelPairs.filter(
        (pair) =>
          !steelMap.has(createSteelKey(pair.codeSteel, pair.shape)),
      );

      if (missingSteels.length > 0) {
        throw new Error(
          formatMissingSteelMessage(missingSteels),
        );
      }

      // 7️⃣ คำนวณข้อมูลสินค้าแต่ละรายการ
      const calculatedProducts = orderPO.products.map(
        (product, index) => {
          const code = String(product.steelType).trim();
          const shape = product.shape as ShapeSteel;

          const steel = steelMap.get(
            createSteelKey(code, shape),
          );

          // ปกติจะไม่เข้าเงื่อนไขนี้ เพราะเช็ก missing ไปก่อนหน้าแล้ว
          if (!steel) {
            throw new Error(
              `SteelType not found: ${code} (${shape})`,
            );
          }

          const unitPrice =
            product.price ?? steel.price;

          const result = calculateWeightDetails({
            shape,
            amount: product.amount,
            width: product.wide ?? undefined,
            length: product.length,
            thickness: product.thickness,
            density: steel.density,
            price: unitPrice,
            weight: product.weight ?? null,
            total: null,
            discount: product.discount ?? null,
            isOD: product.isOD ?? false,
            isServices:
              product.isServices ?? false,
            isPerAmount:
              product.isPerAmount ?? false,
          });

          return {
            product,
            steel,
            unitPrice,
            total: result.total,
            index,
          };
        },
      );

      // 8️⃣ คำนวณยอดรวมทั้งหมด
      const subtotal = round2(
        calculatedProducts.reduce(
          (sum, item) => sum + item.total,
          0,
        ),
      );

      const discount = round2(
        calculatedProducts.reduce(
          (sum, item) =>
            sum + Number(item.product.discount ?? 0),
          0,
        ),
      );

      const subtotalAfterDiscount =
        subtotal - discount;

      const vat = round2(
        (subtotalAfterDiscount * 7) / 100,
      );

      const grandTotal = round2(
        subtotalAfterDiscount + vat,
      );

      // 9️⃣ สร้าง Bill และ OrderPO พร้อม Product
      return tx.bill.create({
        data: {
          Customer: {
            connect: { id: data.customerId },
          },
          codeCustomer: generateCode(),
          deliveryDate: new Date(data.deliveryDate),

          salesName: auth.session.user?.name ?? "",
          Staff_Bill_salesNameToStaff: {
            connect: {
              id: Number(auth.session.user?.id),
            },
          },

          subtotal,
          discount,
          vat,
          grandTotal,

          OrderPO: {
            create: {
              poNumber:
                orderPO.poNumber ?? null,
              Customer: {
                connect: {
                  id: data.customerId,
                },
              },
              urlPo: orderPO.urlPo ?? [],
              total: subtotal,

              Product: {
                create: calculatedProducts.map(
                  (item) => ({
                    SteelType: {
                      connect: {
                        id: item.steel.id,
                      },
                    },
                    sequence:
                      item.product.sequence ??
                      item.index + 1,

                    wide:
                      item.product.wide ?? null,
                    length: item.product.length,
                    thickness:
                      item.product.thickness,
                    amount:
                      item.product.amount,

                    unitPrice:
                      item.unitPrice,
                    actualWeight:
                      item.product.weight ??
                      null,
                    discount:
                      item.product.discount ??
                      null,
                    detail:
                      item.product.detail ??
                      null,
                    job:
                      item.product.job ?? null,
                    cuttingMethod:
                      item.product
                        .cuttingMethod ??
                      "normal",

                    isOD:
                      item.product.isOD ??
                      false,
                    isServices:
                      item.product
                        .isServices ??
                      false,
                    isPerAmount:
                      item.product
                        .isPerAmount ??
                      false,

                    total: item.total,
                  }),
                ),
              },
            },
          },
        },
        include: {
          Customer: true,
          OrderPO: {
            include: { Product: true },
          },
        },
      });
    });

    return NextResponse.json(newBill, {
      status: 201,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
