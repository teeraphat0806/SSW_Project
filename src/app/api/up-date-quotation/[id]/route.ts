import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { UpDateQuotationSchema } from "@/lib/schemas/up-date-quotation.shema";
import { CuttingMethod, ShapeSteel } from "@/types/alltype";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const round2 = (n: number) => Math.round(n * 100) / 100;

export type ApiQuotation = {
  id: number;
  idPO: number;
  idBill?: number | null;
  customerId: number | null;
  customerName: string;
  companyName: string;
  address: string;
  tel: string | null;
  fax: string | null;
  credit: number;
  quotationNo: string;
  salesName: string;
  salesId: number;
  description: string | null;
  deliveryDate: string;
  createdAt: Date;
  updateAt: Date;
  steelItem: {
    SteelId: number;
    steelType: string;
    shape: ShapeSteel;
    sequence: number;
    wide: number | null;
    length: number;
    thickness: number;
    amount: number;
    detail?: string | null;
    cuttingMethod: CuttingMethod;
    weight?: number | null;
    price: number;
    discount?: number | null;
    density: number;
    surfaceT?: string | null;
    toleranceT?: number | null;
    surfaceW?: string | null;
    toleranceW?: number | null;
    surfaceL?: string | null;
    toleranceL?: number | null;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }[];
};

type OrderWithRelation = Prisma.OrderPOGetPayload<{
  include: {
    Product: { include: { SteelType: true } };
    Quotation: true;
  };
}>;

function toApi(order: OrderWithRelation): ApiQuotation {
  if (!order.Quotation) {
    throw new Error("Quotation data is missing in the order.");
  }
  return {
    id: order.Quotation.id,
    idPO: order.id,
    idBill: order.billId ?? null,
    customerId: order.Quotation.customerId ?? null,
    customerName: order.Quotation.customerName,
    companyName: order.Quotation.companyName,
    address: order.Quotation.address,
    tel: order.Quotation.tel ?? null,
    fax: order.Quotation.fax ?? null,
    credit: order.Quotation.credit,
    quotationNo: order.Quotation.quotationNo,
    salesName: order.Quotation.salesName,
    salesId: order.Quotation.salesNameId,
    description: order.Quotation.description ?? null,
    deliveryDate: order.Quotation.deliveryDate,
    createdAt: order.Quotation.createdAt,
    updateAt: order.Quotation.updatedAt,
    steelItem: order.Product.map((product) => ({
      SteelId: product.SteelType.id,
      steelType: product.SteelType.codeSteel,
      shape: product.SteelType.shape,
      sequence: product.sequence,
      wide: product.wide ?? null,
      length: product.length,
      thickness: product.thickness,
      amount: product.amount,
      detail: product.detail ?? null,
      cuttingMethod: product.cuttingMethod,
      weight: product.actualWeight ?? null,
      price: product.unitPrice,
      discount: product.discount ?? null,
      density: product.SteelType.density,
      surfaceT: product.surfaceT ?? null,
      toleranceT: product.toleranceT ?? null,
      surfaceW: product.surfaceW ?? null,
      toleranceW: product.toleranceW ?? null,
      surfaceL: product.surfaceL ?? null,
      toleranceL: product.toleranceL ?? null,
      isOD: product.isOD,
      isServices: product.isServices,
      isPerAmount: product.isPerAmount,
    })),
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
    const order = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        Product: {
          orderBy: [{ sequence: "asc" }],
          include: { SteelType: true },
        },
        Quotation: true,
      },
    });

    if (!order || !order.Quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(toApi(order));
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

  const body = await req.json().catch(() => null);
  const parsed = UpDateQuotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.orderPO.findUnique({
        where: { id: poId },
        include: { Quotation: true },
      });

      if (!existing || !existing.quotationId || !existing.Quotation) {
        throw new Error("Quotation not found");
      }
      // ส่วนแก้ไขข้อมุลทั่วไป
      const editFields = [
        "customerId",
        "customerName",
        "companyName",
        "address",
        "tel",
        "fax",
        "deliveryDate",
        "createdAt",
        "credit",
      ] as const;

      let isEditChanged = false;
      let EditUpdates: Record<string, any> = {};
      //data.customerId เขียนแบบนี้ก็ได้ แต่ data["customerId"] แบบนี้ก็ได้เด้อ
      for (const field of editFields) {
        const newValue = parsed.data[field];
        const oldValue = existing.Quotation[field];

        if (newValue !== undefined && newValue !== oldValue) {
          isEditChanged = true;
          EditUpdates[field] = newValue;
        }
      }

      if (isEditChanged) {
        await tx.quotation.update({
          where: { id: existing.quotationId },
          data: { ...EditUpdates },
        });
      }

      // ส่วนแก้ไขรายการเหล็ก
      if (parsed.data.steelItem) {
        await tx.product.deleteMany({
          where: { orderPOId: poId },
        });
        const steelPairs = Array.from(
          new Set(parsed.data.steelItem.map((item) => item.SteelId)),
        );

        const steelList = await tx.steelType.findMany({
          where: { id: { in: steelPairs } },
        });

        const steelMap = new Map(steelList.map((s) => [s.id, s]));

        await tx.product.createMany({
          data: parsed.data.steelItem.map((item) => {
            const steelInfo = steelMap.get(item.SteelId);

            if (!steelInfo) {
              throw new Error(
                `ไม่พบข้อมูลประเภทเหล็ก (SteelId: ${item.SteelId}) ในระบบ`,
              );
            }

            const { total } = calculateWeightDetails({
              shape: steelInfo.shape,
              amount: item.amount,
              length: item.length,
              width: item.wide ?? undefined,
              thickness: item.thickness,
              density: steelInfo.density,
              price: item.price,
              weight: item.weight ?? null,
              discount: item.discount ?? null,
              isOD: item.isOD ?? false,
              isServices: item.isServices ?? false,
              isPerAmount: item.isPerAmount ?? false,
            });

            return {
              orderPOId: poId,
              steelId: item.SteelId,
              sequence: item.sequence,
              wide: item.wide ?? undefined,
              length: item.length,
              thickness: item.thickness,
              amount: item.amount,
              detail: item.detail ?? undefined,
              cuttingMethod: item.cuttingMethod,
              actualWeight: item.weight ?? undefined,
              discount: item.discount ?? undefined,
              unitPrice: item.price,
              surfaceT: item.surfaceT ?? undefined,
              toleranceT: item.toleranceT ?? undefined,
              surfaceW: item.surfaceW ?? undefined,
              toleranceW: item.toleranceW ?? undefined,
              surfaceL: item.surfaceL ?? undefined,
              toleranceL: item.toleranceL ?? undefined,
              isOD: item.isOD,
              isServices: item.isServices,
              isPerAmount: item.isPerAmount,
              total,
            };
          }),
        });

        // หาค่ารวมจำนวนเงินกับส่วนลดรวม
        const sum = await tx.product.aggregate({
          where: { orderPOId: poId },

          _sum: { total: true, discount: true },
        });

        const subtotal = sum._sum.total ?? 0;
        const discount = sum._sum.discount ?? 0;
        const vatRate = existing.Quotation?.vatRate ?? 0;
        const vat = round2(subtotal * (vatRate / 100));
        const grandTotal = round2(subtotal + vat);

        // รวมกันละอัพเดททีเดียว ไม่ต้อง await หลายรอบ
        const updatePromises = [];
        // อัพเดท total ใน orderPO
        updatePromises.push(
          tx.orderPO.update({
            where: { id: poId },
            data: { total: sum._sum.total ?? 0 },
          }),
        );
        //ถ้ามี Quotation ก็อัพเดทด้วย
        if (existing.Quotation) {
          updatePromises.push(
            tx.quotation.update({
              where: { id: existing.quotationId },
              data: {
                subtotal,
                vat,
                grandTotal,
              },
            }),
          );
        }
        // ถ้ามี bill ก็อัพเดทด้วย
        if (existing.billId) {
          updatePromises.push(
            tx.bill.update({
              where: { id: existing.billId },
              data: {
                subtotal,
                discount,
                vat,
                grandTotal,
              },
            }),
          );
        }
        // รันทุกอัพเดทพร้อมกัน
        await Promise.all(updatePromises);
      }

      const order = await tx.orderPO.findUnique({
        where: { id: poId },
        include: {
          Product: {
            orderBy: [{ sequence: "asc" }],
            include: { SteelType: true },
          },
          Quotation: true,
        },
      });

      if (!order || !order.Quotation) {
        throw new Error("Quotation not found");
      }

      return order;
    });

    return NextResponse.json(toApi(updated));
  } catch (error) {
    console.error("Error updating quotation:", error);

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("quotation not found")
    ) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
