import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/permissions";
import { calculateWeightDetails, digitsOnly } from "@/lib/calculateGrandTotal";
import { generateCode } from "@/lib/generateCode";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";

/* =========================================================
   TYPE DEFINITIONS
========================================================= */

type CreateOrderInput = z.infer<typeof CreateNewOrderSchema>;
type OrderPO = CreateOrderInput["orderPO"];
type Product = OrderPO["products"][number];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

class DuplicateFieldsError extends Error {
  duplicateFields: string[];
  constructor(duplicateFields: string[]) {
    super("ข้อมูลซ้ำในระบบ (unique constraint)");
    this.duplicateFields = duplicateFields;
  }
}

// ปัดเลขให้เหลือ 2 ตำแหน่ง
function round2(num: number) {
  return Math.round(num * 100) / 100;
}

/* =========================================================
   MAIN ROUTE
========================================================= */

export async function POST(req: NextRequest) {
  // 1️⃣ ตรวจสอบสิทธิ์ผู้ใช้
  const auth = await requireAuth(["superadmin", "supervisor", "clerk"]);

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

    const steelPairs = Array.from(
      new Set(orderPO.products.map((p) => p.SteelId)),
    );

    // 5️⃣ เริ่ม transaction
    const newBill = await prisma.$transaction(async (tx) => {
      // ดึงเหล็กจาก database
      const steelList = await tx.steelType.findMany({
        where: { id: { in: steelPairs } },
      });

      let CustomerId: number | undefined = data.customerId;
      if (!CustomerId) {
        if (!data.companyName || !data.address || !data.tax) {
          throw new Error(
            "Customer information is required when customerId is not provided.",
          );
        }

        const taxNumber = digitsOnly(data.tax);
        let telSearch = null;
        if (data.tel) {
          telSearch = digitsOnly(data.tel);
        }
        let faxNumberSearch = null;
        if (data.fax) {
          faxNumberSearch = digitsOnly(data.fax);
        }

        try {
          const newCustomer = await tx.customer.create({
            data: {
              name: data.companyName,
              address: data.address,
              tel: data.tel ?? null,
              telSearch: telSearch,
              faxNumber: data.fax ?? null,
              faxNumberSearch: faxNumberSearch,
              taxNumber: taxNumber || null,
              email: data.email ?? null,
            },
          });
          CustomerId = newCustomer.id;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const targetRaw = (error.meta as any)?.target;
            let duplicateFields = Array.isArray(targetRaw)
              ? targetRaw.map(String)
              : targetRaw
                ? [String(targetRaw)]
                : [];
            throw new DuplicateFieldsError(duplicateFields);
          }
        }
      }

      // สร้าง map ไว้ค้นหาเหล็กเร็ว ๆ
      const steelMap = new Map(steelList.map((steel) => [steel.id, steel]));
      // 7️⃣ คำนวณข้อมูลสินค้าแต่ละรายการ
      const calculatedProducts = orderPO.products.map((product, index) => {
        const steel = steelMap.get(product.SteelId);

        // ปกติจะไม่เข้าเงื่อนไขนี้ เพราะเช็ก missing ไปก่อนหน้าแล้ว
        if (!steel) {
          throw new Error(
            `SteelType not found: ${product.steelType} (${product.shape})`,
          );
        }

        const unitPrice = product.price ?? steel.price;

        const result = calculateWeightDetails({
          shape: product.shape,
          amount: product.amount,
          width: product.wide ?? undefined,
          length: product.length,
          thickness: product.thickness,
          density: steel.density,
          price: unitPrice,
          weight: product.weight ?? null,
          total: null,
          discount: null,
          isOD: product.isOD ?? false,
          isServices: product.isServices ?? false,
          isPerAmount: product.isPerAmount ?? false,
        });

        return {
          product,
          steel,
          unitPrice,
          total: result.total,
          index,
        };
      });

      // 8️⃣ คำนวณยอดรวมทั้งหมด
      const subtotal = round2(
        calculatedProducts.reduce((sum, item) => sum + item.total, 0),
      );

      const discount = round2(
        calculatedProducts.reduce(
          (sum, item) => sum + Number(item.product.discount ?? 0),
          0,
        ),
      );

      const vat = round2((subtotal - discount) * (7 / 100));

      const grandTotal = round2(subtotal - discount + vat);

      // 9️⃣ สร้าง Bill และ OrderPO พร้อม Product
      return tx.bill.create({
        data: {
          Customer: {
            connect: { id: CustomerId },
          },
          codeCustomer: generateCode(),
          deliveryDate: new Date(data.deliveryDate),

          salesName: auth.session.user?.name ?? "",
          Staff_Bill_salesNameToStaff: {
            connect: {
              id: Number(auth.session.user?.id),
            },
          },
          Staff_Bill_deliveredByToStaff: {
            connect: { id: 10 },
          },
          deliveredBy: "นายวิรุณ ม่วงศรี",

          subtotal,
          discount,
          vat,
          grandTotal,

          OrderPO: {
            create: {
              poNumber: orderPO.poNumber ?? null,
              Customer: {
                connect: {
                  id: CustomerId,
                },
              },
              urlPo: orderPO.urlPo ?? [],
              total: subtotal,

              Product: {
                create: calculatedProducts.map((item) => ({
                  SteelType: {
                    connect: {
                      id: item.steel.id,
                    },
                  },
                  sequence: item.product.sequence ?? item.index + 1,

                  wide: item.product.wide ?? null,
                  length: item.product.length,
                  thickness: item.product.thickness,
                  amount: item.product.amount,

                  unitPrice: item.unitPrice,
                  actualWeight: item.product.weight ?? null,
                  discount: item.product.discount ?? null,
                  detail: item.product.detail ?? null,
                  job: item.product.job ?? null,
                  cuttingMethod: item.product.cuttingMethod ?? "normal",

                  isOD: item.product.isOD ?? false,
                  isServices: item.product.isServices ?? false,
                  isPerAmount: item.product.isPerAmount ?? false,

                  total: item.total,
                })),
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
    if (error instanceof DuplicateFieldsError) {
      return NextResponse.json(
        {
          error: error.message,
          duplicateFields: error.duplicateFields,
          prismaCode: "P2002",
        },
        { status: 409 },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const targetRaw = (error.meta as any)?.target;
        let duplicateFields = Array.isArray(targetRaw)
          ? targetRaw.map(String)
          : targetRaw
            ? [String(targetRaw)]
            : [];

        // Fallback: Prisma sometimes doesn't expose meta.target; parse from message
        if (!duplicateFields.length && typeof error.message === "string") {
          // Example: Unique constraint failed on the fields: ("taxNumber")
          const m = error.message.match(/fields:\s*\((.*)\)/i);
          if (m?.[1]) {
            duplicateFields = Array.from(
              new Set(Array.from(m[1].matchAll(/"([^"]+)"/g)).map((x) => x[1])),
            );
          }
        }

        return NextResponse.json(
          {
            error: "ข้อมูลซ้ำในระบบ (unique constraint)",
            duplicateFields,
            prismaCode: error.code,
          },
          { status: 409 },
        );
      }
    }

    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
