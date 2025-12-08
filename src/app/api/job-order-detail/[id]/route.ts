import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {Staff} from "@/types/staff";
import { Product } from "@/types/product";
type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  keyPo: string[];
  staff: {
    name: string;
    role: string | null;
  }[];
  steel: {
    steelType: string;
    amount: number;
    width: number | null;
    length: number | null;
    thickness: number | null;
    price: number | null;
    weight: number | null;
  }[];
  updatedAt: string | null;
  status: string;
  createdAt: Date;
  deliveryDate: string | null;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poId = Number(id);

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

    const apiJobOrder: ApiJobOrder = {
      id: jobOrder.id,
      poNumber: jobOrder.poNumber,
      customerId: jobOrder.Customer?.id?.toString() ?? null,
      customerName: jobOrder.customer?.name ?? null,
      customerEmail: jobOrder.Customer?.email ?? null,
      customerPhone: jobOrder.Customer?.tel ?? null,
      deliveryAddress: jobOrder.Customer?.address ?? null,
      keyPo: jobOrder.urlPo,
      staff: jobOrder.Staff.map((s: Staff) => ({
        name: s.user?.name ?? s.code, // ถ้า user.name ไม่มี ใช้ code แทน
        role: s.position ?? null, // ตอนนี้ใช้ position แทน role เช่น "cutter", "supervisor"
      })),
      steel: jobOrder.Product.map((p: Product) => ({
        steelType: p.SteelType?.codeSteel,
        amount: p.amount ?? 0, // สมมติว่าเก็บจำนวนใน field amount
        width: p.wide ?? null, // สมมติ
        length: p.length ?? null,
        thickness: p.thickness ?? null,
        price: p.price ?? null,
        weight: p.weight ?? null,
      })),
      status: jobOrder.status,
      createdAt: jobOrder.date,
      updatedAt: jobOrder.updatedAt,
      deliveryDate: jobOrder.completedAt
        ? jobOrder.completedAt.toISOString().split("T")[0]
        : null,
    };

    return NextResponse.json(apiJobOrder, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fecth OrderPo" },
      { status: 500 }
    );
  }
}
