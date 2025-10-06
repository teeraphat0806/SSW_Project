import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import prisma from "../../../../lib/prisma";
import { StaffSchema } from "../../../../lib/schemas/staff.schema";
// GET /api/payroll/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    const result = await prisma.staff.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { name: true } } },
    });
    if (!result) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    const payload = {
      ...result,
      staffName: result.user?.name ?? null,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
      { status: 500 }
    );
  }
}

// PUT /api/payroll/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = StaffSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  try {
    const result = await prisma.staff.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff income: " + error },
      { status: 500 }
    );
  }
}

// DELETE /api/payroll/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    await prisma.staff.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete payroll: " + error },
      { status: 500 }
    );
  }
  return NextResponse.json({ message: `Delete Complete` });
}
