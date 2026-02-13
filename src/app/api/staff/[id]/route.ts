import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";
import { StaffSchema } from "../../../../lib/schemas/staff.schema";
import { requireAuth } from "@/lib/permissions";
// GET /api/payroll/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  try {
    const result = await prisma.staff.findUnique({
      where: { id: Number(id) },
      include: { user: { select: { name: true } }, jobPosition: true },
    });
    if (!result) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    const payload = {
      ...result,
      staffName: result.user?.name ?? null,
      jobPositionName: result.jobPosition?.name ?? null,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff details: " + error },
      { status: 500 },
    );
  }
}

// PUT /api/payroll/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  const body = await req.json();
  const parsed = StaffSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  if (parsed.data.positionId) {
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: parsed.data.positionId },
    });

    if (!jobPosition) {
      return NextResponse.json(
        { error: "ไม่พบตำแหน่งงานที่ระบุ" },
        { status: 400 },
      );
    }
  }
  try {
    const result = await prisma.staff.update({
      where: { id: Number(id) },
      data: parsed.data,
      include: {
        jobPosition: true,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff details: " + error },
      { status: 500 },
    );
  }
}

// DELETE /api/payroll/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  try {
    await prisma.staff.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete staff: " + error },
      { status: 500 },
    );
  }
  return NextResponse.json({ message: `Delete Complete` });
}
