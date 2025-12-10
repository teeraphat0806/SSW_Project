import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { OrderPOSchema } from "../../../../lib/schemas/orderPO.schema";
import { requireAuth } from "@/lib/permissions";
// GET /api/payroll/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    const result = await prisma.orderPO.findUnique({
      where: { id: Number(id) },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orderPO: " + error },
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
  const parsed = OrderPOSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  try {
    const result = await prisma.orderPO.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update orderPO: " + error },
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
    await prisma.orderPO.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    console.error("error: ", error);
    return NextResponse.json(
      { error: "Failed to delete orderPO" },
      { status: 500 }
    );
  }
  return NextResponse.json({ message: `Delete Complete` });
}
