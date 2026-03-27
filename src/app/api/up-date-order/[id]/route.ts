import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { ShapeSteel, CuttingMethod, status } from "@/types";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { ApiJobOrder } from "@/types/order.types";

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
    urlPo: order.urlPo ?? [],
    steel: order.Product.map((p) => ({
      id: String(p.id),
      SteelId: p.steelId,
      steelType: p.SteelType.codeSteel,

      shape: p.SteelType.shape as ShapeSteel,
      sequence: p.sequence,
      wide: p.wide ?? null,
      length: p.length ?? 0,
      thickness: p.thickness ?? 0,
      amount: p.amount,
      detail: p.detail ?? null,
      cuttingMethod: (p.cuttingMethod ?? "normal") as CuttingMethod,

      weight: p.actualWeight ?? null,
      price: p.unitPrice ?? 0,
      discount: p.discount ?? null,
      density: p.SteelType.density,
      job: p.job ?? null,

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
  steelType: z.string(),
  SteelId: z.number().int().positive(),
  shape: z.enum(["square", "line"]),
  sequence: z.number().int().positive(),
  wide: z.number().nullable(),
  length: z.number(),
  thickness: z.number(),
  amount: z.number().int().positive(),
  detail: z.string().nullable().optional(),
  cuttingMethod: z.enum(["normal", "FB", "RM", "CNC"]).optional(),
  job: z.string().trim().nullable().optional(),
  weight: z.number().nonnegative().nullable().optional(),
  discount: z.number().nonnegative().nullable().optional(),
  price: z.number().nonnegative().optional(),

  isOD: z.boolean().optional(),
  isServices: z.boolean().optional(),
  isPerAmount: z.boolean().optional(),
});

const PatchSchema = z.object({
  status: StatusSchema.optional(),
  credit: z.coerce.number().int().nonnegative().optional(),
  customerId: z.string().trim().optional(),
  poNumber: z.string().trim().optional(),
  deliveryDate: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  urlPo: z.array(z.string()).optional(),
  steel: z.array(SteelLineSchema).optional(),
});

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
        select: { id: true, billId: true, quotationId: true },
      });
      if (!existing) throw new Error("Order not found");

      if (existing.billId == null) {
        throw new Error("No bill associated with this order");
      }
      //ตรวจสอบว่ามี Bill ที่เชื่อมโยงกับ Order นี้อยู่จริงไหม
      const existingBill = await tx.bill.findUnique({
        where: { id: existing.billId },
        select: { id: true, vatRate: true },
      });
      if (!existingBill) throw new Error("Bill not found");

      //ตรวจสอบว่ามี Quotation ที่เชื่อมโยงกับ Order นี้อยู่จริงไหม (ถ้ามี)
      let existingQuotation: { id: number } | null = null;
      if (existing.quotationId) {
        existingQuotation = await tx.quotation.findUnique({
          where: { id: existing.quotationId },
          select: { id: true },
        });
        if (!existingQuotation) throw new Error("Quotation not found");
      }

      // Record เอาไว้เก็บ key-value ข้อมูลหมด
      const orderUpdates: Record<string, any> = {};
      const billUpdates: Record<string, any> = {};
      const quotationUpdates: Record<string, any> = {};

      // ตรวจวันที่ส่ง
      if (patch.deliveryDate) {
        billUpdates.deliveryDate = patch.deliveryDate;
      }
      //วันที่ส้ราง
      if (patch.createdAt) {
        billUpdates.createdAt = patch.createdAt;
        quotationUpdates.createdAt = patch.createdAt; // ให้ Quotation เปลี่ยนตามด้วย
      }
      //เครดิต
      if (patch.credit !== undefined) {
        billUpdates.credit = patch.credit;
        quotationUpdates.credit = patch.credit; // ให้ Quotation เปลี่ยนตามด้วย
      }
      //poNumber
      if (patch.poNumber !== undefined) {
        const nextPoNumber = patch.poNumber.trim();
        orderUpdates.poNumber = nextPoNumber === "" ? null : nextPoNumber;
      }
      // KeyFile
      if (patch.urlPo) {
        orderUpdates.urlPo = patch.urlPo.map((k) =>
          String(k).replace(/^\/+/, ""),
        );
      }
      //status
      if (patch.status) {
        orderUpdates.status = patch.status;
        orderUpdates.completedAt =
          patch.status === "completed" ? new Date() : null;
      }
      //customerId
      if (
        typeof patch.customerId === "string" ||
        typeof patch.customerId === "number"
      ) {
        const customerid = Number(patch.customerId);
        if (!Number.isInteger(customerid) || customerid <= 0) {
          throw new Error("Invalid customerId");
        }

        const customer = await tx.customer.findUnique({
          where: { id: customerid },
          select: { id: true },
        });
        if (!customer) throw new Error("Customer not found");

        orderUpdates.customerId = customerid;
        billUpdates.customerId = customerid;
        quotationUpdates.customerId = customerid;
      }
      const updateAll = [];
      // Object.keys() จะได้เป็น array ของชื่อฟิลด์ที่มีการอัปเดต แล้วค่อยเช็กทีเดียวตอนจะสั่ง update จริงๆ ว่ามีอะไรบ้าง ถ้ามีอย่างน้อย 1 ฟิลด์ถึงจะสั่ง update
      if (Object.keys(billUpdates).length > 0) {
        updateAll.push(
          tx.bill.update({
            where: { id: existing.billId },
            data: billUpdates,
          }),
        );
      }

      //  สั่งอัปเดต Quotation (ถ้ามีข้อมูลให้แก้ และออเดอร์นี้ผูกกับ Quotation อยู่)
      if (Object.keys(quotationUpdates).length > 0 && existingQuotation) {
        updateAll.push(
          await tx.quotation.update({
            where: { id: existing.quotationId },
            data: quotationUpdates,
          }),
        );
      }
      // สั่งอัปเดต OrderPO ถ้ามีข้อมูลให้แก้
      if (Object.keys(orderUpdates).length > 0) {
        updateAll.push(
          await tx.orderPO.update({
            where: { id: poId },
            data: orderUpdates,
          }),
        );
      }
      if (updateAll.length > 0) {
        //นำคำสั่ง update ทั้งหมดที่เตรียมไว้ไปรันพร้อมกัน
        await Promise.all(updateAll);
      }

      // update steel
      if (patch.steel) {
        const steelPairs = Array.from(
          new Set(patch.steel.map((p) => p.SteelId)),
        );

        if (patch.steel.length === 0)
          throw new Error("ต้องมีรายการเหล็กอย่างน้อย 1 รายการ");
        if (patch.steel.length > 15)
          throw new Error("เพิ่มสินค้าได้ไม่เกิน 15 รายการ");
        const steelTypes = await tx.steelType.findMany({
          where: {
            id: { in: steelPairs },
          },
          select: {
            id: true,
            codeSteel: true,
            density: true,
            shape: true,
          },
        });

        const steelMap = new Map(steelTypes.map((s) => [s.id, s]));
        const missing = steelPairs.filter((steelId) => !steelMap.has(steelId));
        if (missing.length)
          throw new Error(`SteelType not found: ${missing.join(", ")}`);

        await tx.product.deleteMany({ where: { orderPOId: poId } });

        let subtotal = 0;
        let totalDiscount = 0;

        // สร้างใหม่รายการเหล็กทั้งหมด
        await tx.product.createMany({
          // l คือ line item ที่ส่งมาใน patch
          data: patch.steel.map((l, index) => {
            //st คือ steelType จาก database
            const steel = steelMap.get(l.SteelId)!;
            const price = safeNum(l.price);
            const { total } = calculateWeightDetails({
              shape: steel.shape as ShapeSteel,
              amount: l.amount,
              width: l.wide ?? 0,
              length: l.length,
              thickness: l.thickness,

              density: steel.density,
              weight: l.weight ?? null,
              price,
              discount: null,

              isOD: l.isOD ?? false,
              isServices: l.isServices ?? false,
              isPerAmount: l.isPerAmount ?? false,
            });
            subtotal += total;
            totalDiscount += l.discount ?? 0;

            return {
              orderPOId: poId,
              sequence: index + 1,
              steelId: steel.id,
              wide: l.wide ?? null,
              length: l.length ?? null,
              thickness: l.thickness ?? null,
              amount: l.amount,
              detail: l.detail ?? null,
              unitPrice: price,
              actualWeight: l.weight ?? null,
              job: l.job ?? null,
              cuttingMethod: l.cuttingMethod ?? "normal",
              discount: l.discount ?? null,
              isOD: l.isOD ?? false,
              isServices: l.isServices ?? false,
              isPerAmount: l.isPerAmount ?? false,
              total,
            };
          }),
        });

        if (existingBill) {
          //  มี Bill อยู่แล้ว → update
          const vatRate = existingBill.vatRate ?? 7;
          const vat = round2((subtotal - totalDiscount) * (vatRate / 100));
          const grandTotal = round2(subtotal - totalDiscount + vat);

          const updatePromises: Promise<any>[] = [
            tx.orderPO.update({
              where: { id: poId },
              data: { total: subtotal },
            }),
            tx.bill.update({
              where: { id: existingBill.id },
              data: {
                subtotal,
                discount: totalDiscount,
                vat,
                grandTotal,
              },
            }),
          ];
          if (existingQuotation) {
            updatePromises.push(
              tx.quotation.update({
                where: { id: existingQuotation!.id },
                data: {
                  subtotal,
                  discount: totalDiscount,
                  vat,
                  grandTotal,
                },
              }),
            );
          }

          await Promise.all(updatePromises);
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
          bill: {
            select: { credit: true, deliveryDate: true, createdAt: true },
          },
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
