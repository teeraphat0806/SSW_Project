import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcAcquittanceTotals } from "@/lib/billingCalc";

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
    if (!statementId)
      return NextResponse.json(
        { error: "statementId is required" },
        { status: 400 },
      );

    const acquittance = await prisma.$transaction(async (tx) => {
      const statement = await tx.statement.findUnique({
        where: { id: statementId },
        include: {
          items: {
            include: {
              invoice: { include: { OrderPO: { include: { bill: true } } } },
            },
          },
        },
      });

      if (!statement) {
        const err = new Error("Statement not found");
        (err as any).code = "STATEMENT_NOT_FOUND";
        throw err;
      }
      if (statement.items.length === 0) {
        const err = new Error("Statement has no invoices");
        (err as any).code = "EMPTY_STATEMENT";
        throw err;
      }

      for (const it of statement.items) {
        if (!it.invoice.OrderPO.bill) {
          const err = new Error("Some invoices have no Bill yet");
          (err as any).code = "BILL_MISSING";
          (err as any).invoiceId = it.invoiceId;
          (err as any).orderPOId = it.invoice.OrderPO.id;
          throw err;
        }
      }

      const aq = await tx.acquittance.create({
        data: { customerId: statement.customerId },
      });

      await tx.acquittanceInvoice.createMany({
        data: statement.items.map((it) => ({
          acquittanceId: aq.id,
          invoiceId: it.invoiceId,
        })),
      });

      return aq;
    });

    const totals = await calcAcquittanceTotals(acquittance.id);
    return NextResponse.json({ acquittance, totals });
  } catch (error: any) {
    console.error(error);

    if (error.code === "STATEMENT_NOT_FOUND")
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    if (error.code === "EMPTY_STATEMENT")
      return NextResponse.json(
        { error: "Statement has no invoices" },
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
        {
          error:
            "One or more invoices already used in another acquittance (receipt)",
        },
        { status: 400 },
      );

    return NextResponse.json(
      { error: "Failed to create acquittance" },
      { status: 500 },
    );
  }
}
