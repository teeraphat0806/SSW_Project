import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(["superadmin", "accountant", "clerk"]);
  if ("response" in authResult) return authResult.response;

  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const orderPO = await prisma.orderPO.findUnique({
      where: { id: poId },
      select: { codetoinvoice: true },
    });

    if (!orderPO) {
      return NextResponse.json(
        { error: "ไม่พบ Order PO นี้" },
        { status: 404 },
      );
    }
    
    const existingInvoice = await prisma.invoice.findUnique({
      where: { codetoinvoice: orderPO.codetoinvoice },
    });

    if(existingInvoice) {
      return NextResponse.json(
        { error: "ใบแจ้งหนี้สำหรับ Order PO นี้มีอยู่แล้ว" },
        { status: 400 },
      );
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        codetoinvoice: orderPO.codetoinvoice,
      }});

    return NextResponse.json(newInvoice, { status: 201 });


  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะประมวลผลใบแจ้งหนี้" },
      { status: 500 },
    );
  }
}
