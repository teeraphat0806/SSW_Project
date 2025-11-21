import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { StaffSalarySchema } from "../../../../lib/schemas/staffSalary.schema";
import prisma from "../../../../lib/prisma";
// GET /api/payroll/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    const result = await prisma.staffSalary.findUnique({
      where: { id: Number(id) },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staffSalary: " + error },
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
  const parsed = StaffSalarySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    const result = await prisma.staffSalary.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staffSalary: " + error },
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
    await prisma.staffSalary.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete staffSalary: " + error },
      { status: 500 }
    );
  }
  return NextResponse.json({ message: `Delete Complete` });
}
