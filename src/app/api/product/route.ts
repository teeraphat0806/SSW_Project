import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { ProductSchema } from "../../../lib/schemas/product.schema";
import { requireAuth } from "@/lib/permissions";
export async function GET(req: NextRequest) {
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
    const result = await prisma.product.findMany({
      include: {
        SteelType: true,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Product: " + error },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
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

  const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
  const parsed = ProductSchema.safeParse(body); // ✅ ตรวจสอบ schema

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const latestProduct = await prisma.product.findFirst({
      where: { orderPOId: parsed.data.orderPOId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    const sequence = parsed.data.sequence ?? (latestProduct?.sequence ?? 0) + 1;

    const result = await prisma.product.create({
      data: {
        sequence,
        wide: parsed.data.wide,
        length: parsed.data.length,
        thickness: parsed.data.thickness,
        amount: parsed.data.amount,
        total: parsed.data.total,
        actualWeight: parsed.data.actualWeight,
        SteelType: {
          connect: { id: parsed.data.steelid },
        },
        OrderPO: {
          connect: { id: parsed.data.orderPOId },
        },
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create Product" },
      { status: 500 }
    );
  }
}
