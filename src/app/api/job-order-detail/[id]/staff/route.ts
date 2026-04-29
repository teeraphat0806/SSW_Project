// src/app/api/job-order-detail/[id]/staff/route.ts
import { requireAuth } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RoleEnum = z.enum(["supervisor", "cutter"]);
const QueryRoleEnum = z.enum(["supervisor", "cutter", "delivery"]);

const AssignSchema = z.object({
  staffId: z.number().int(),
  role: RoleEnum,
});

const AssignDeliverySchema = z.object({
  staffId: z.number().int().nullable().optional(),
  role: z.literal("delivery"),
});

const QuerySchema = z.object({
  role: QueryRoleEnum,
});

function allowedRoles(role: z.infer<typeof QueryRoleEnum>): Role[] {
  return role === "supervisor"
    ? ["superadmin", "clerk", "supervisor"]
    : role === "delivery"
      ? ["superadmin", "clerk", "delivery"]
      : ["superadmin", "clerk", "cutter"];
}

type staffApi = {
  id: number;
  name: string;
  role: "supervisor" | "cutter" | "delivery";
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const parsedQ = QuerySchema.safeParse({
    role: url.searchParams.get("role"),
  });
  if (!parsedQ.success) {
    return NextResponse.json(
      { error: parsedQ.error.flatten() },
      { status: 400 },
    );
  }
  const role = parsedQ.data.role;

  const authResult = await requireAuth(allowedRoles(role));
  if ("response" in authResult) return authResult.response;

  try {
    const staff = await prisma.staff.findMany({
      where: { user: { role } },
      include: { user: true },
      orderBy: { id: "asc" },
    });
    const formattedStaff: staffApi[] = staff.map((s) => ({
      id: s.id,
      name: s.user?.name ?? s.code ?? "ไม่ระบุชื่อ", // ✅ string เสมอ
      role: (s.user?.role ?? "cutter") as "supervisor" | "cutter" | "delivery", // ✅ กัน user null
    }));
    return NextResponse.json(formattedStaff, { status: 200 });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const parsed = AssignSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { staffId, role } = parsed.data;

  const authResult = await requireAuth(allowedRoles(role));
  if ("response" in authResult) return authResult.response;

  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    //เพิ่ม upsert แทนการใช้ create แบบเดิม เพื่อป้องกันการเพิ่มข้อมูลซ้ำ
    await prisma.orderPOStaff.upsert({
      where: {
        //เงื่อนไขการหา record ที่จะ update
        orderPOId_staffId_role: { orderPOId: poId, staffId, role },
      },
      create: { orderPOId: poId, staffId, role }, //ถ้าไม่พบ record จะสร้างใหม่
      update: {}, //ถ้าพบ record แล้ว จะไม่ทำอะไร
    });
    return NextResponse.json(
      { message: "Assigned successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error assigning staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const parsed = AssignSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { staffId, role } = parsed.data;

  const authResult = await requireAuth(allowedRoles(role));
  if ("response" in authResult) return authResult.response;

  try {
    await prisma.orderPOStaff.deleteMany({
      where: { orderPOId: poId, staffId, role },
    });

    return NextResponse.json(
      { message: "Removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error removing staff assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// เพิ่มสำหรับมอบหมายงานให้พนักงานส่งของ
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const parsed = AssignDeliverySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { staffId, role } = parsed.data;

  const authResult = await requireAuth(allowedRoles(role));
  if ("response" in authResult) return authResult.response;

  try {
    const order = await prisma.orderPO.findUnique({
      where: { id: poId },
      select: { billId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.billId == null) {
      return NextResponse.json(
        { error: "Bill not found for this order" },
        { status: 404 },
      );
    }


    //ถ้าไม่มี staffId คือลบคนส่งของ
    if (staffId == null) {
      await prisma.bill.update({
        where: { id: order.billId },
        data: {
          deliveredById: null,
          deliveredBy: null,
        },
      });

      return NextResponse.json(
        { message: "Delivery assignment cleared successfully" },
        { status: 200 },
      );
    }

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        user: { select: { name: true, role: true } },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (staff.user?.role !== "delivery") {
      return NextResponse.json(
        { error: "Selected staff is not delivery role" },
        { status: 400 },
      );
    }

    await prisma.bill.update({
      where: { id: order.billId },
      data: {
        deliveredById: staffId,
        deliveredBy: staff.user?.name ?? "Unknown",
      },
    });

    return NextResponse.json(
      { message: "Delivery assignment updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating delivery assignment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
