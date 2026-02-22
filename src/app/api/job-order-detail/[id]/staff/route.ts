// src/app/api/job-order-detail/[id]/staff/route.ts
import { requireAuth } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RoleEnum = z.enum(["supervisor", "cutter"]);

const AssignSchema = z.object({
  staffId: z.number().int(),
  role: RoleEnum,
});

const QuerySchema = z.object({
  role: RoleEnum,
});

function toUserRole(role: z.infer<typeof RoleEnum>) {
  return role === "supervisor" ? "supervisor" : "cutter";
}

function allowedRoles(role: z.infer<typeof RoleEnum>): Role[] {
  return role === "supervisor"
    ? ["superadmin", "clerk", "supervisor"]
    : ["superadmin", "clerk", "cutter"];
}

type staffApi = {
  id: number;
  name: string;
  role: "supervisor" | "cutter";
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

  const userRole = toUserRole(parsedQ.data.role);
  const authResult = await requireAuth(allowedRoles(parsedQ.data.role));
  if ("response" in authResult) return authResult.response;

  try {
    const staff = await prisma.staff.findMany({
      where: { user: { role: userRole } },
      include: { user: true },
      orderBy: { id: "asc" },
    });
    if (!staff) {
      return NextResponse.json(
        { error: `Not found ${userRole}` },
        { status: 404 },
      );
    }
    const formattedStaff: staffApi[] = staff.map((s) => ({
      id: s.id,
      name: s.user?.name ?? s.code ?? "ไม่ระบุชื่อ", // ✅ string เสมอ
      role: (s.user?.role ?? "cutter") as "supervisor" | "cutter", // ✅ กัน user null
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
