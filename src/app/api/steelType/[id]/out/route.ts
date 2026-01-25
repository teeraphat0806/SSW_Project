// src/app/api/steelType/[id]/out/route.ts

import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";

import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const OutSchema = z.object({
  steelStockId: z.number().int().positive(),
  quantity: z.number().int().positive().min(1, "จำนวนต้องไม่น้อยกว่า 1"),
});

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
  const parsed = OutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (prisma) => {
      //ตรวจสอบ stock ที่มีอยู่
      const stock = await prisma.steelStock.findUnique({
        where: { id: parsed.data.steelStockId },
        select: { id: true, steeltypeId: true, quantity: true },
      });

      if (!stock || stock.steeltypeId !== steeltypeId) {
        throw new Error("ไม่พบสต็อกเหล็กที่ระบุหรือไม่ตรงกับประเภทเหล็ก");
      }
      if (stock.quantity < parsed.data.quantity) {
        throw new Error("จำนวนในสต็อกไม่เพียงพอ");
      }

      const newQuantity = stock.quantity - parsed.data.quantity;
      //ทำการลด stock
      const updatedStock = await prisma.steelStock.update({
        where: { id: stock.id },
        data: {
          quantity: newQuantity,
          status: newQuantity > 0 ? "available" : "withdrawn",
        },
      });

      await prisma.steelType.update({
        where: { id: steeltypeId },
        data: { amount: { decrement: parsed.data.quantity } },
      });
      return updatedStock;
    });

    return NextResponse.json(
      { message: "Stock updated successfully", data: result },
      { status: 200 },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("ไม่พบสต็อก")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes("ไม่เพียงพอ")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error", details: msg },
      { status: 500 },
    );
  }
}
