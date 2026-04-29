import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { OrderPOSchema } from "../../../lib/schemas/orderPO.schema";
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
    const result = await prisma.orderPO.findMany({});

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orderPO: " + error },
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
  const parsed = OrderPOSchema.safeParse(body); // ✅ ตรวจสอบ schema

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const result = await prisma.orderPO.create({
      data: parsed.data, // ✅ ใช้ข้อมูลที่ผ่านการตรวจสอบแล้ว
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create orderPO" },
      { status: 500 }
    );
  }
}
