import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const body = await req.json();
    const statementId = Number(body.statementId);
    const invoiceId = Number(body.invoiceId);

    if (!statementId || !invoiceId) {
      return NextResponse.json(
        { error: "statementId and invoiceId are required" },
        { status: 400 },
      );
    }

    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
    });
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { OrderPO: true },
    });

    if (!statement || !invoice) {
      return NextResponse.json(
        { error: "Statement or Invoice not found" },
        { status: 404 },
      );
    }

    // invoice ต้องเป็นของลูกค้าคนเดียวกัน
    if (invoice.OrderPO.customerId !== statement.customerId) {
      return NextResponse.json(
        { error: "Invoice belongs to different customer" },
        { status: 400 },
      );
    }

    // เพิ่ม relation (unique invoiceId จะกัน invoice ไปอยู่ statement อื่นอยู่แล้ว)
    const item = await prisma.statementInvoice.create({
      data: { statementId, invoiceId },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This invoice is already used in another statement" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add invoice to statement" },
      { status: 500 },
    );
  }
}
