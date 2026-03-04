import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcStatementTotals } from "@/lib/billingCalc";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const usePagination = limitParam !== null && pageParam !== null;

    let statementItems;
    let total;
    if (usePagination) {
      total = await prisma.statement.count();
      statementItems = await prisma.statement.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      total = await prisma.statement.count();
      statementItems = await prisma.statement.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      statementItems,
      total,
      page: usePagination ? page : undefined,
      limit: usePagination ? limit : undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch statement items" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const rawInvoiceIds: number[] = Array.isArray(body.invoiceIds)
      ? body.invoiceIds.map(Number)
      : [];

    const invoiceIds = Array.from(
      new Set(rawInvoiceIds.filter((id) => Number.isFinite(id) && id > 0)),
    );

    if (!statementId || !Number.isFinite(statementId)) {
      return NextResponse.json(
        { error: "statementId is required" },
        { status: 400 },
      );
    }

    if (invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "invoiceIds must be a non-empty array" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const statement = await tx.statement.findUnique({
        where: { id: statementId },
      });

      if (!statement) {
        const err = new Error("Statement not found");
        (err as any).code = "STATEMENT_NOT_FOUND";
        throw err;
      }

      const invoices = await tx.invoice.findMany({
        where: { id: { in: invoiceIds } },
        include: {
          OrderPO: { include: { bill: true } },
          statementItem: { select: { statementId: true } },
        },
      });

      if (invoices.length !== invoiceIds.length) {
        const err = new Error("Some invoices not found");
        (err as any).code = "INVOICE_NOT_FOUND";
        throw err;
      }

      for (const inv of invoices) {
        if (inv.OrderPO.customerId !== statement.customerId) {
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

        if (
          inv.statementItem &&
          inv.statementItem.statementId !== statement.id
        ) {
          const err = new Error("Invoice already used in another statement");
          (err as any).code = "INVOICE_USED_OTHER_STATEMENT";
          (err as any).invoiceId = inv.id;
          throw err;
        }
      }

      await tx.statementInvoice.deleteMany({
        where: { statementId: statement.id },
      });

      await tx.statementInvoice.createMany({
        data: invoiceIds.map((invoiceId) => ({
          statementId: statement.id,
          invoiceId,
        })),
      });
    });

    const totals = await calcStatementTotals(statementId);

    return NextResponse.json({
      ok: true,
      statementId,
      totals,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "STATEMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    }

    if (error.code === "INVOICE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Some invoices not found" },
        { status: 404 },
      );
    }

    if (error.code === "INVOICE_WRONG_CUSTOMER") {
      return NextResponse.json(
        {
          error: "Invoice belongs to different customer",
          invoiceId: error.invoiceId,
        },
        { status: 400 },
      );
    }

    if (error.code === "BILL_MISSING") {
      return NextResponse.json(
        {
          error: "Some invoices have no Bill yet",
          invoiceId: error.invoiceId,
          orderPOId: error.orderPOId,
        },
        { status: 400 },
      );
    }

    if (error.code === "INVOICE_USED_OTHER_STATEMENT") {
      return NextResponse.json(
        {
          error: "One or more invoices already used in another statement",
          invoiceId: error.invoiceId,
        },
        { status: 400 },
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "One or more invoices already used in another statement" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update statement invoices" },
      { status: 500 },
    );
  }
}
