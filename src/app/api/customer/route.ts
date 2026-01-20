// src/app/api/customer/route.ts
import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { CustomerSchema } from "../../../lib/schemas/customer.schema";

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
    const result = await prisma.customer.findMany({});

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers: " + error },
      { status: 500 },
    );
  }
}
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
  const parsed = CustomerSchema.safeParse(body); // ✅ ตรวจสอบ schema

  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const result = await prisma.customer.create({
      data: parsed.data,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create Customer" },
      { status: 500 },
    );
  }
}
