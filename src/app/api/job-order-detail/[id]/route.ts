import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
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
  steelActual: any[]; // ยังไม่มี model จริง จะใส่ [] ไว้ก่อน
  status: string;
  createdAt: Date;
  deliveryDate: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const poId = Number(params.id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const jobOrder = await prisma.orderPO.findUnique({
    where: { id: poId },
    include: {
      bill: true,
      Product: true,
      Customer: true,
      Staff: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!jobOrder) {
    return NextResponse.json({ error: "Job order not found" }, { status: 404 });
  }

  // 🔧 map Prisma result -> รูปแบบแบบ mockJobOrder
  const apiJobOrder: ApiJobOrder = {
    id: jobOrder.id,
    poNumber: jobOrder.poNumber,
    customerId:
      jobOrder.Customer?.code ?? jobOrder.customerId?.toString() ?? null,
    customerName: jobOrder.customer?.name ?? null,
    customerEmail: jobOrder.Customer?.email ?? null,
    customerPhone: jobOrder.Customer?.tel ?? null,
    deliveryAddress: jobOrder.Customer?.address ?? null,
    staff: jobOrder.Staff.map((s) => ({
      name: s.user?.name ?? s.code, // ถ้า user.name ไม่มี ใช้ code แทน
      role: s.position ?? null, // ตอนนี้ใช้ position แทน role เช่น "cutter", "supervisor"
    })),
    steel: jobOrder.Product.map((p) => ({
      // TODO: ตรงนี้อามต้องแมปตาม field จริงใน model Product ของตัวเอง
      steelType: p.name ?? "UNKNOWN", // สมมติว่ามี field name
      amount: p.amount ?? 0, // สมมติว่าเก็บจำนวนใน field amount
      width: p.width ?? null, // สมมติ
      length: p.length ?? null,
      thickness: p.thickness ?? null,
      price: p.price ?? null,
      weight: p.weight ?? null,
    })),
    steelActual: [], // ตอนนี้ยังไม่มี model น้ำหนักจริง เอา [] ไปก่อน
    status: jobOrder.status,
    createdAt: jobOrder.date,
    deliveryDate: jobOrder.completedAt
      ? jobOrder.completedAt.toISOString().split("T")[0]
      : null,
  };

  return NextResponse.json(apiJobOrder, { status: 200 });
}
