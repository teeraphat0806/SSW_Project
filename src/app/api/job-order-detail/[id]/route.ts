import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customercode: string;
  deliveryAddress: string;
  keyPo: string[];
  staff: {
    id: number;
    name: string;
    role: string;
  }[];
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length?: number;
    thickness?: number;
    price: number;
    weight: number;
    density: number;
    detail?: string;
    shape: string;
  }[];
  updatedAt: Date;
  status: string;
  createdAt: Date;
  deliveryDate: Date;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const jobOrder = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        bill: true,
        Product: {
          include: {
            SteelType: true,
          },
        },
        Customer: true,
        Staff: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!jobOrder) {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 }
      );
    }

    // 🔴 ถ้าไม่มี Customer หรือ Bill ถือว่าข้อมูล order เสีย / ไม่สมบูรณ์
    if (!jobOrder.Customer || !jobOrder.bill) {
      return NextResponse.json(
        { error: "Order is missing Customer or Bill relation" },
        { status: 500 }
      );
    }

    const customer = jobOrder.Customer;
    const bill = jobOrder.bill;

    const apiJobOrder: ApiJobOrder = {
      id: jobOrder.id,
      poNumber: jobOrder.poNumber,
      customerId: customer.id.toString(),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.tel,
      customercode: customer.code,
      deliveryAddress: customer.address,
      keyPo: jobOrder.urlPo ?? [],
      staff:
        jobOrder.Staff?.map((s) => ({
          id: s.id,
          name: s.user?.name ?? s.code,
          role: s.user?.role ?? "unknown",
        })) ?? [],
      steel: jobOrder.Product.map((p) => ({
        steelType: p.SteelType.codeSteel, // SteelType เป็น non-null ตาม schema
        amount: p.amount,
        width: p.wide ?? undefined,
        length: p.length ?? undefined,
        thickness: p.thickness ?? undefined,
        price: p.SteelType.price,
        density: p.SteelType.density,
        detail: p.detail ?? undefined,
        shape: p.SteelType.shape,
        // actualWeight เป็น optional → ถ้าไม่มีใช้ calculatedWeight ถ้าไม่มีอีกให้ 0
        weight: p.actualWeight ?? 0,
      })),
      status: jobOrder.status,
      // createdAt จาก OrderPO เอง (ตาม schema)
      createdAt: jobOrder.createdAt,
      updatedAt: jobOrder.updatedAt,
      // deliveryDate ต้องมาจาก Bill (บังคับมีค่าใน schema)
      deliveryDate: bill.deliveryDate,
    };

    return NextResponse.json(apiJobOrder, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch OrderPO";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
