import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { ShapeSteel, CuttingMethod, status } from "@/types";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";

type ApiJobOrder = {
  id: number;
  poNumber: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string;
  customerTaxId: string;
  customerFax: string | null;
  deliveryDate: Date;
  createdAt: Date;
  credit: number;
  steel: {
    id: number;
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: ShapeSteel;
    job: number | null;
    cuttingMethod: CuttingMethod;
    discount?: number | null;
    price: number;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }[];
  status: status;
};

//ตัวช่วยแปลงข้อมูลจาก Prisma เป็น ApiJobOrder
type OrderWithRelations = Prisma.OrderPOGetPayload<{
  include: {
    Product: { include: { SteelType: true } };
    Customer: true;
    bill: { select: { credit: true; deliveryDate: true; createdAt: true } };
  };
}>;

function toApiJobOrder(order: OrderWithRelations): ApiJobOrder {
  if (!order.Customer) {
    throw new Error("Order is missing Customer relation");
  }
  if (!order.bill) {
    throw new Error("Order is missing bill relation");
  }
  const customer = order.Customer;
  const bill = order.bill;

  return {
    id: order.id,
    poNumber: order.poNumber ?? null,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.tel,
    customerAddress: customer.address,
    customerTaxId: customer.taxNumber,
    customerFax: customer.faxNumber,
    deliveryDate: bill.deliveryDate,
    createdAt: bill.createdAt,
    credit: bill.credit ?? 30,
    steel: order.Product.map((p) => ({
      id: p.id,
      steelType: p.SteelType.codeSteel,
      amount: p.amount,
      width: p.wide ?? undefined,
      length: p.length ?? 0,
      thickness: p.thickness ?? 0,
      detail: p.detail ?? null,
      weight: p.actualWeight ?? null,
      shape: p.SteelType.shape as ShapeSteel,
      job: p.job ?? null,
      cuttingMethod: (p.cuttingMethod ?? "normal") as CuttingMethod,
      discount: p.discount ?? null,
      price: p.unitPrice ?? 0,
      isOD: p.isOD,
      isServices: p.isServices,
      isPerAmount: p.isPerAmount,
    })),
    status: order.status as status,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const jobOrder = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        Product: {
          orderBy: [{ sequence: "asc" }],
          include: {
            SteelType: true,
          },
        },
        Customer: true,
        bill: { select: { credit: true, deliveryDate: true, createdAt: true } },
      },
    });

    if (!jobOrder || !jobOrder.Customer) {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(toApiJobOrder(jobOrder), { status: 200 });
  } catch (error) {
    console.error("Error fetching job order:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch job order";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const StatusSchema = z.enum([
  "pending",
  "cutting",
  "weighing",
  "ready",
  "shipped",
  "completed",
  "canceled",
]);

const SteelLineSchema = z.object({
  codeSteel: z.string().trim().min(1),
  shape: z.enum(["square", "line"]),
  amount: z.number().int().min(1),
  width: z.number().nonnegative().nullable().optional(),
  length: z.number().nonnegative(),
  thickness: z.number().nonnegative(),
  weight: z.number().nonnegative().nullable().optional(),
  detail: z.string().nullable().optional(),
  cuttingMethod: z.enum(["normal", "FB", "RM", "CNC"]).optional(),
  job: z.number().int().nullable().optional(),
  discount: z.number().nonnegative().nullable().optional(),
  price: z.number().nonnegative(),
  isOD: z.boolean().optional(),
  isServices: z.boolean().optional(),
  isPerAmount: z.boolean().optional(),
});

const steelKey = (codeSteel: string, shape: ShapeSteel) =>
  `${codeSteel}::${shape}`;

const PatchSchema = z.object({
  status: StatusSchema.optional(),
  // credit (days) must be a positive integer; allow coercion from string inputs.
  credit: z.coerce.number().int().positive().optional(),
  customerId: z.string().trim().optional(),
  poNumber: z.string().trim().optional(),
  deliveryDate: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  steel: z.array(SteelLineSchema).optional(),
});

// type UpdateOrderPayload = {
//   status?: statusType;
//   customerId?: string;
//   steel?: Array<{
//     id: number;
//     steelType: string;
//     amount: number;
//     width?: number;
//     length: number;
//     thickness: number;
//     detail?: string;

//   }>;
// };

const round2 = (n: number) => Math.round(n * 100) / 100;

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const poId = Number(id);
    if (Number.isNaN(poId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.issues);
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const patch = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.orderPO.findUnique({
        where: { id: poId },
        select: { id: true, billId: true },
      });
      if (!existing) throw new Error("Order not found");

      const credit = patch.credit;
      const createdAt = patch.createdAt;
      if (credit !== undefined && existing.billId == null) {
        throw new Error("No bill associated with this order");
      }
      if (createdAt !== undefined && existing.billId == null) {
        throw new Error("No bill associated with this order");
      }

      // deliveryDate (ถ้ามีส่งมา)
      if (patch.deliveryDate || patch.createdAt) {
        if (existing.billId == null) {
          throw new Error("No bill associated with this order");
        }
        await tx.bill.update({
          where: { id: existing.billId },
          data: {
            ...(patch.deliveryDate ? { deliveryDate: patch.deliveryDate } : {}),
            ...(patch.createdAt ? { createdAt: patch.createdAt } : {}),
          },
        });
      }

      //ถ้ามี poNumber ส่งมา ให้ตรวจสอบความซ้ำซ้อนก่อน update
      if (patch.poNumber !== undefined) {
        const nextPoNumber = patch.poNumber.trim();
        if (nextPoNumber === "") {
          await tx.orderPO.update({
            where: { id: poId },
            data: { poNumber: null },
          });
        } else {
          // const poNumberExists = await tx.orderPO.findFirst({
          //   where: {
          //     id: { not: poId },
          //     poNumber: nextPoNumber,
          //   },
          //   select: { id: true },
          // });

          // if (poNumberExists) {
          //   throw new Error("PO Number already exists");
          // }
          await tx.orderPO.update({
            where: { id: poId },
            data: { poNumber: nextPoNumber },
          });
        }
      }

      // customerId (ถ้ามีส่งมา)
      let nextCustomerId: number | undefined = undefined;
      if (typeof patch.customerId === "string") {
        const cid = Number(patch.customerId);
        if (!Number.isInteger(cid) || cid <= 0)
          throw new Error("Invalid customerId");

        const customer = await tx.customer.findUnique({
          where: { id: cid },
          select: { id: true },
        });
        if (!customer) throw new Error("Customer not found");

        nextCustomerId = cid;
      }

      // update status + customerId
      await tx.orderPO.update({
        where: { id: poId },
        data: {
          ...(patch.status ? { status: patch.status } : {}),
          ...(patch.status
            ? patch.status === "completed"
              ? { completedAt: new Date() }
              : { completedAt: null }
            : {}),
          ...(nextCustomerId !== undefined
            ? { customerId: nextCustomerId }
            : {}),
        },
      });

      // If we're only updating credit (no steel changes), update the bill here.
      if (credit !== undefined && !patch.steel) {
        await tx.bill.update({
          where: { id: existing.billId! },
          data: { credit },
        });
      }

      // update steel
      if (patch.steel) {
        const requestedSteels = Array.from(
          new Set(
            patch.steel
              .map((l) =>
                steelKey(
                  l.codeSteel.trim(),
                  (l.shape ?? "square") as ShapeSteel,
                ),
              )
              .filter(Boolean),
          ),
        ).map((k) => {
          const [codeSteel, shape] = k.split("::");
          return {
            codeSteel: codeSteel ?? "",
            shape: (shape ?? "square") as ShapeSteel,
          };
        });

        if (patch.steel.length === 0) {
          throw new Error("ต้องมีรายการเหล็กอย่างน้อย 1 รายการ");
        }
        if (patch.steel.length > 15) {
          throw new Error("เพิ่มสินค้าได้ไม่เกิน 15 รายการ");
        }
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
            // price: true,
            density: true,
            shape: true,
          },
        });

        const codeShapeToSteel = new Map<string, (typeof steelTypes)[0]>(
          steelTypes.map((s) => [
            steelKey(s.codeSteel, s.shape as unknown as ShapeSteel),
            s,
          ]),
        );
        const missing = requestedSteels.filter(
          ({ codeSteel, shape }) =>
            !codeShapeToSteel.has(steelKey(codeSteel, shape)),
        );
        if (missing.length)
          throw new Error(
            `SteelType not found: ${missing
              .map(({ codeSteel, shape }) => `${codeSteel} (${shape})`)
              .join(", ")}`,
          );
        await tx.product.deleteMany({ where: { orderPOId: poId } });

        // สร้างใหม่รายการเหล็กทั้งหมด
        await tx.product.createMany({
          // l คือ line item ที่ส่งมาใน patch
          data: patch.steel.map((l, index) => {
            //st คือ steelType จาก database
            const code = l.codeSteel.trim();
            const shape = (l.shape ?? "square") as ShapeSteel;
            const st = codeShapeToSteel.get(steelKey(code, shape))!;

            const { total } = calculateWeightDetails({
              shape: st.shape as ShapeSteel,
              amount: l.amount,
              width: l.width ?? undefined,
              length: l.length,
              thickness: l.thickness,

              density: st.density,
              weight: l.weight ?? null,
              price: l.price,
              discount: l.discount ?? null,

              isOD: l.isOD ?? false,
              isServices: l.isServices ?? false,
              isPerAmount: l.isPerAmount ?? false,
            });

            return {
              orderPOId: poId,
              sequence: index + 1,
              steelId: st.id,
              wide: l.width ?? null,
              length: l.length ?? null,
              thickness: l.thickness ?? null,
              amount: l.amount,
              detail: l.detail ?? null,
              unitPrice: l.price,
              actualWeight: l.weight ?? null,
              job: l.job ?? null,
              cuttingMethod: l.cuttingMethod ?? "normal",
              discount: l.discount ?? null,
              isOD: l.isOD ?? false,
              isServices: l.isServices ?? false,
              isPerAmount: l.isPerAmount ?? false,
              total: l.isPerAmount ? l.price * l.amount : total,
            };
          }),
        });
        // หาค่ารวมจำนวนเงินกับส่วนลดรวม
        const sum = await tx.product.aggregate({
          where: { orderPOId: poId },

          _sum: { total: true, discount: true },
        });

        // update total ใน orderPO
        await tx.orderPO.update({
          where: { id: poId },
          data: { total: sum._sum.total ?? 0 },
        });

        const subtotal = sum._sum.total ?? 0;
        const discount = sum._sum.discount ?? 0;

        // update บิลที่เชื่อมโยงกับ orderPO นี้
        const orderWithBill = await tx.orderPO.findUnique({
          where: { id: poId },
          select: {
            billId: true,
            customerId: true,
          },
        });

        if (!orderWithBill) throw new Error("Order not found");

        let bill;

        if (orderWithBill.billId) {
          // 🔁 มี Bill อยู่แล้ว → update
          bill = await tx.bill.findUnique({
            where: { id: orderWithBill.billId },
            select: { id: true, vatRate: true },
          });

          if (!bill) throw new Error("Bill not found");

          const vatRate = bill.vatRate ?? 7;
          const subtotalafterDiscount = round2(subtotal - discount);
          const vat = round2(subtotalafterDiscount * (vatRate / 100));
          const grandTotal = round2(subtotalafterDiscount + vat);

          await tx.bill.update({
            where: { id: bill.id },
            data: {
              subtotal,
              discount,
              vat,
              grandTotal,
              ...(credit !== undefined ? { credit } : {}),
            },
          });
        } else {
          throw new Error("No bill associated with this order");
        }
      }

      // ✅ re-fetch แบบ include เพื่อ map ออกเป็น ApiJobOrder
      const order = await tx.orderPO.findUnique({
        where: { id: poId },
        include: {
          Product: {
            orderBy: [{ sequence: "asc" }, { id: "asc" }],
            include: { SteelType: true },
          },
          Customer: true,
          bill: { select: { credit: true, deliveryDate: true, createdAt: true } },
        },
      });

      if (!order || !order.Customer)
        throw new Error("Order not found after update");

      return toApiJobOrder(order);
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
