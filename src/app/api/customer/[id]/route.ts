import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";

import prisma from "../../../../lib/prisma";
import { CustomerSchema } from "../../../../lib/schemas/customer.schema";
// GET /api/customer/[id]
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
    const result = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customer: " + error },
      { status: 500 },
    );
  }
}

// PATCH /api/customer/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  const body = await req.json();
  const parsed = CustomerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "ไม่พบลูกค้าที่ระบุ" },
        { status: 404 },
      );
    }

    const result = await prisma.customer.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update customer: " + error },
      { status: 500 },
    );
  }
}

// DELETE /api/customer/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  const customerId = Number(id);
  if (!Number.isFinite(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,

        _count: { select: { Bill: true, OrderPO: true } },
      },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (customer._count.Bill > 0 || customer._count.OrderPO > 0) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing bills or orders" },
        { status: 400 },
      );
    }
    await prisma.customer.delete({
      where: { id: customerId },
    });
    return NextResponse.json({ message: `Delete Complete` }, { status: 200 });
  } catch (error) {
    console.error("error: ", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}
