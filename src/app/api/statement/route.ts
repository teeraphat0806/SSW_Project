import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcStatementTotals } from "@/lib/billingCalc";
import {
  getCurrentBuddhistYear,
  withBuddhistYearPrefix,
} from "@/lib/statementNumber";

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
    const searchParam = searchParams.get("search");
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const usePagination = limitParam !== null && pageParam !== null;

    // Build where clause based on filters
    const where: any = {};

    // Search by customer name or statement number
    if (searchParam && searchParam.trim()) {
      const searchTerm = searchParam.trim();
      const isNumber = /^\d+$/.test(searchTerm);

      if (isNumber) {
        // If search term is a number, search by statementNo
        const statementNo = parseInt(searchTerm, 10);
        where.statementNo = statementNo;
      } else {
        // Search by customer name - find matching customer IDs first
        const customers = await prisma.customer.findMany({
          where: {
            name: {
              contains: searchTerm,
            },
          },
          select: { id: true },
        });

        if (customers.length === 0) {
          // No matching customers, return empty result
          return NextResponse.json({
            statementItems: [],
            total: 0,
            page: usePagination ? page : undefined,
            limit: usePagination ? limit : undefined,
          });
        }

        where.customerId = {
          in: customers.map((c) => c.id),
        };
      }
    }

    // Filter by date range
    if (dateFromParam || dateToParam) {
      where.createdAt = {};
      if (dateFromParam) {
        where.createdAt.gte = new Date(`${dateFromParam}T00:00:00.000Z`);
      }
      if (dateToParam) {
        where.createdAt.lte = new Date(`${dateToParam}T23:59:59.999Z`);
      }
    }

    let statementItems;
    let total;
    const currentBuddhistYear = getCurrentBuddhistYear();
    const currentYearStatementNo = await prisma.$queryRaw<
      { maxNo: number | null }[]
    >`
      SELECT MAX("statementNo")::int AS "maxNo"
      FROM "Statement"
      WHERE "statementNo" IS NOT NULL
        AND "statementNo"::text LIKE ${`${currentBuddhistYear}%`}
    `;
    const legacyStatementNo = await prisma.$queryRaw<
      { maxNo: number | null }[]
    >`
      SELECT MAX("statementNo")::int AS "maxNo"
      FROM "Statement"
      WHERE "statementNo" IS NOT NULL
        AND "statementNo"::text NOT LIKE '25__%'
    `;
    const nextStatementNo =
      currentYearStatementNo[0]?.maxNo !== null &&
      currentYearStatementNo[0]?.maxNo !== undefined
        ? currentYearStatementNo[0].maxNo + 1
        : withBuddhistYearPrefix((legacyStatementNo[0]?.maxNo ?? 0) + 1);
    if (usePagination) {
      total = await prisma.statement.count({ where });
      statementItems = await prisma.statement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      total = await prisma.statement.count({ where });
      statementItems = await prisma.statement.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      statementItems,
      total,
      page: usePagination ? page : undefined,
      limit: usePagination ? limit : undefined,
      nextStatementNo,
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
    const rawStatementDate =
      typeof body.statementDate === "string" ? body.statementDate.trim() : "";
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

    let parsedStatementDate: Date | null = null;
    if (rawStatementDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawStatementDate)) {
        return NextResponse.json(
          { error: "statementDate must be in YYYY-MM-DD format" },
          { status: 400 },
        );
      }

      const candidate = new Date(`${rawStatementDate}T00:00:00.000Z`);
      if (Number.isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: "statementDate is invalid" },
          { status: 400 },
        );
      }

      parsedStatementDate = candidate;
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

      if (invoiceIds.length === 0) {
        if (statement.statementNo !== null) {
          const err = new Error(
            "Cannot delete all invoices from a numbered statement",
          );
          (err as any).code = "STATEMENT_ALREADY_NUMBERED";
          throw err;
        }

        await tx.statement.delete({
          where: { id: statement.id },
        });

        return;
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

      if (parsedStatementDate) {
        await tx.statement.update({
          where: { id: statement.id },
          data: { createdAt: parsedStatementDate },
        });
      }
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

    if (error.code === "STATEMENT_ALREADY_NUMBERED") {
      return NextResponse.json(
        {
          error: "Cannot delete all invoices from a numbered statement",
        },
        { status: 400 },
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
