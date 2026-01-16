import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const BodySchema = z.object({
  staffId: z.number().int(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;
  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { staffId } = parsed.data;

  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff)
    return NextResponse.json({ error: "cutter not found" }, { status: 404 });

  try {
    await prisma.orderPOStaff.create({
      data: {
        orderPOId: poId,
        staffId: staffId,
        role: "cutter",
      },
    });

    return NextResponse.json(
      { message: "cutter assigned successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error assigning cutter:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;
  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    await prisma.orderPOStaff.delete({
      where: {
        orderPOId_staffId_role: {
          orderPOId: poId,
          staffId: parsed.data.staffId,
          role: "cutter",
        },
      },
    });
    return NextResponse.json(
      { message: "cutter removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing cutter:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;

  try {
    const cutter = await prisma.staff.findMany({
      where: {
        user: { role: "cutter" },
      },
      include: {
        user: true,
      },
    });
    return NextResponse.json(cutter, { status: 200 });
  } catch (error) {
    console.error("Error fetching cutters:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
