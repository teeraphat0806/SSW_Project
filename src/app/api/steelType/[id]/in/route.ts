// src/app/api/steelType/[id]/in/route.ts
import { requireAuth } from "@/lib/permissions";
import { SteelStockSchema } from "@/lib/schemas/steelstock.schema";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { promises } from "dns";

export async function POST(
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
  const parsed = SteelStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const steelType = await prisma.steelType.findUnique({
      where: { id: steeltypeId },
      select: { id: true, shape: true },
    });
    if (!steelType) {
      return NextResponse.json(
        { error: "Steel type not found" },
        { status: 404 },
      );
    }
    if (steelType.shape === "square" && parsed.data.width === null) {
      return NextResponse.json(
        { error: "Width is required for square shape" },
        { status: 400 },
      );
    }

    //ถ้าเป็น shape line ให้เก็บ width เป็น null เสมอ
    const width = steelType.shape === "line" ? null : parsed.data.width;

    //ทำการเพิ่ม stock และอัปเดตจำนวน steel type พร้อมกันใน transaction
    const [stockRow] = await prisma.$transaction([
      //เพิ่ม stock
      prisma.steelStock.upsert({
        where: {
          steeltypeId_width_length_thickness: {
            steeltypeId,
            width,
            length: parsed.data.length,
            thickness: parsed.data.thickness,
          },
        },
        create: {
          steeltypeId,
          quantity: parsed.data.quantity,
          width,
          length: parsed.data.length,
          thickness: parsed.data.thickness,
          status: "available",
        },
        update: {
          quantity: { increment: parsed.data.quantity },
          status: "available",
        },
      }),

      //อัปเดตจำนวน steel type
      prisma.steelType.update({
        where: { id: steeltypeId },
        data: { amount: { increment: parsed.data.quantity } },
      }),
    ]);

    return NextResponse.json(stockRow, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch steelType: " + error },
      { status: 500 },
    );
  }
}
