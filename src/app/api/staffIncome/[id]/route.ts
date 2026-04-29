import { NextRequest, NextResponse } from "next/server";

import { StaffIncomeSchema } from "../../../../lib/schemas/staffIncome.schema";
import prisma from "../../../../lib/prisma";
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
    const result = await prisma.staffIncome.findUnique({
      where: { id: Number(id) },
      include: {
        Staff: {
          select: {
            jobPosition: true,
            bankAccount: true,
            startDate: true,
            code: true,
            social_security: true,
            currentSalary: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log("error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
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
  const parsed = StaffIncomeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    const result = await prisma.staffIncome.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update staff income: " + error },
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
    await prisma.staffIncome.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete payroll: " + error },
      { status: 500 },
    );
  }
  return NextResponse.json({ message: `Delete Complete` });
}
