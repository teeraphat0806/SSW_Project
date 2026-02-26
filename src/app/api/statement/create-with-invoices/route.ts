import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcStatementTotals } from "@/lib/billingCalc";

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
    const customerId = Number(body.customerId);
    const invoiceIds: number[] = Array.isArray(body.invoiceIds)
      ? body.invoiceIds.map(Number)
      : [];

    if (!customerId)
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 },
      );
    if (invoiceIds.length === 0)
      return NextResponse.json(
        { error: "invoiceIds must be a non-empty array" },
        { status: 400 },
      );

    const statement = await prisma.$transaction(async (tx) => {
      const st = await tx.statement.create({ data: { customerId } });

      const invoices = await tx.invoice.findMany({
        where: { id: { in: invoiceIds } },
        include: { OrderPO: { include: { bill: true } } },
      });

      if (invoices.length !== invoiceIds.length) {
        const err = new Error("Some invoices not found");
        (err as any).code = "INVOICE_NOT_FOUND";
        throw err;
      }

      for (const inv of invoices) {
        if (inv.OrderPO.customerId !== customerId) {
          const err = new Error("Invoice belongs to different customer");
          (err as any).code = "INVOICE_WRONG_CUSTOMER";
          (err as any).invoiceId = inv.id;
          throw err;
        }
        if (!inv.OrderPO.bill) {
          const err = new Error("Invoice OrderPO has no Bill");
          (err as any).code = "BILL_MISSING";
          (err as any).invoiceId = inv.id;
          (err as any).orderPOId = inv.OrderPO.id;
          throw err;
        }
      }

      await tx.statementInvoice.createMany({
        data: invoiceIds.map((invoiceId) => ({
          statementId: st.id,
          invoiceId,
        })),
      });

      return st;
    });

    const totals = await calcStatementTotals(statement.id);
    return NextResponse.json({ statement, totals });
  } catch (error: any) {
    console.error(error);

    if (error.code === "INVOICE_NOT_FOUND")
      return NextResponse.json(
        { error: "Some invoices not found" },
        { status: 404 },
      );
    if (error.code === "INVOICE_WRONG_CUSTOMER")
      return NextResponse.json(
        {
          error: "Invoice belongs to different customer",
          invoiceId: error.invoiceId,
        },
        { status: 400 },
      );

    if (error.code === "BILL_MISSING")
      return NextResponse.json(
        {
          error: "Some invoices have no Bill yet",
          invoiceId: error.invoiceId,
          orderPOId: error.orderPOId,
        },
        { status: 400 },
      );

    if (error.code === "P2002")
      return NextResponse.json(
        { error: "One or more invoices already used in another statement" },
        { status: 400 },
      );

    return NextResponse.json(
      { error: "Failed to create statement" },
      { status: 500 },
    );
  }
}
