import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { SteelTypeSchema } from "@/lib/schemas/steeltype.shema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const result = await prisma.steelType.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        SteelStock: { where: { quantity: { gt: 0 } } }, //gt: 0 คือ quantity != 0
      },
    });
    console.log("result", result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch steelType: " + error },
      { status: 500 },
    );
  }
}
// PATCH /api/steelType/[id]
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);
  if ("response" in authResult) {
    return authResult.response;
  }
  const steeltypeId = Number(id);
  if (isNaN(steeltypeId) || steeltypeId <= 0) {
    return NextResponse.json(
      { error: "Invalid steel type ID" },
      { status: 400 },
    );
  }
  const body = await req.json();
  const parsed = SteelTypeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const steeltype = await prisma.steelType.findUnique({
      where: { id: steeltypeId },
    });
    if (!steeltype) {
      return NextResponse.json(
        { error: "ไม่พบประเภทเหล็กที่ระบุ" },
        { status: 404 },
      );
    }

    const result = await prisma.steelType.update({
      where: { id: steeltypeId },
      data: parsed.data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update steel type: " + error },
      { status: 500 },
    );
  }
}

// DELETE /api/steelType/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);
  if ("response" in authResult) {
    return authResult.response;
  }
  const steeltypeId = Number(id);
  if (isNaN(steeltypeId) || steeltypeId <= 0) {
    return NextResponse.json(
      { error: "Invalid steel type ID" },
      { status: 400 },
    );
  }

  try {
    const steeltype = await prisma.steelType.findUnique({
      where: { id: steeltypeId },
      select: { id: true, _count: { select: { Product: true } } },
    });

    if (!steeltype) {
      return NextResponse.json(
        { error: "ไม่พบประเภทเหล็กที่ระบุ" },
        { status: 404 },
      );
    }

    if (steeltype._count.Product > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบประเภทเหล็กที่มีสินค้าใช้งานอยู่" },
        { status: 400 },
      );
    }
    //ลบสต็อกที่เกี่ยวข้อง
    await prisma.steelStock.deleteMany({
      where: { steeltypeId: steeltypeId },
    });

    await prisma.steelType.delete({
      where: { id: steeltypeId },
    });

    return NextResponse.json(
      { message: "ลบประเภทเหล็กเรียบร้อยแล้ว" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete steel type: " + error },
      { status: 500 },
    );
  }
}
