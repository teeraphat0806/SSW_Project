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
    const acquittanceId = Number(body.acquittanceId);
    const invoiceId = Number(body.invoiceId);

    if (!acquittanceId || !invoiceId) {
      return NextResponse.json(
        { error: "acquittanceId and invoiceId are required" },
        { status: 400 },
      );
    }

    const acquittance = await prisma.acquittance.findUnique({
      where: { id: acquittanceId },
    });
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { OrderPO: true },
    });

    if (!acquittance || !invoice) {
      return NextResponse.json(
        { error: "Acquittance or Invoice not found" },
        { status: 404 },
      );
    }

    // ✅ invoice ต้องเป็นของลูกค้าคนเดียวกัน
    if (invoice.OrderPO.customerId !== acquittance.customerId) {
      return NextResponse.json(
        { error: "Invoice belongs to different customer" },
        { status: 400 },
      );
    }

    const item = await prisma.acquittanceInvoice.create({
      data: { acquittanceId, invoiceId },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "This invoice is already used in another acquittance (receipt)",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add invoice to acquittance" },
      { status: 500 },
    );
  }
}
