import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

// GET /api/orderPo/[id]/invoice - Check if OrderPO has Invoice
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { id } = await context.params;
  const orderId = Number(id);

  if (isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const orderPO = await prisma.orderPO.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        codetoinvoice: true,
        Invoice: {
          select: {
            id: true,
            invoiceNo: true,
            createdAt: true,
            statementItem: {
              select: {
                statementId: true,
                statement: {
                  select: {
                    id: true,
                    statementNo: true,
                    customerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orderPO) {
      return NextResponse.json({ error: "OrderPO not found" }, { status: 404 });
    }

    return NextResponse.json({
      orderId: orderPO.id,
      codetoinvoice: orderPO.codetoinvoice,
      hasInvoice: orderPO.Invoice !== null,
      invoice: orderPO.Invoice,
      statement: orderPO.Invoice?.statementItem?.statement || null,
    });
  } catch (error) {
    console.error("Error checking invoice:", error);
    return NextResponse.json(
      { error: "Failed to check invoice" },
      { status: 500 },
    );
  }
}
