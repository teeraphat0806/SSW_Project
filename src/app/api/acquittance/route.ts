import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import { calcAcquittanceTotals } from "@/lib/billingCalc";
import prisma from "@/lib/prisma";

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
    const where: any = {};

    // Search by customer name or acquittance number
    if (searchParam && searchParam.trim()) {
      const searchTerm = searchParam.trim();
      const isNumber = /^\d+$/.test(searchTerm);

      if (isNumber) {
        // If search term is a number, search by acquittanceNo
        const acquittanceNo = parseInt(searchTerm, 10);
        where.acquittanceNo = acquittanceNo;
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
            acquittanceItems: [],
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

    let acquittanceItems;
    let total;

    if (usePagination) {
      total = await prisma.acquittance.count({ where });
      acquittanceItems = await prisma.acquittance.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      total = await prisma.acquittance.count({ where });
      acquittanceItems = await prisma.acquittance.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      acquittanceItems,
      total,
      page: usePagination ? page : undefined,
      limit: usePagination ? limit : undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch acquittance items" },
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
    const acquittanceId = Number(body.acquittanceId);
    const rawacquittanceDate =
      typeof body.acquittanceDate === "string"
        ? body.acquittanceDate.trim()
        : "";
    const rawInvoiceIds: number[] = Array.isArray(body.invoiceIds)
      ? body.invoiceIds.map(Number)
      : [];

    const invoiceIds = Array.from(
      new Set(rawInvoiceIds.filter((id) => Number.isFinite(id) && id > 0)),
    );

    if (!acquittanceId || !Number.isFinite(acquittanceId)) {
      return NextResponse.json(
        { error: "acquittanceId is required" },
        { status: 400 },
      );
    }

    if (invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "invoiceIds must be a non-empty array" },
        { status: 400 },
      );
    }

    let parsedacquittanceDate: Date | null = null;
    if (rawacquittanceDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(rawacquittanceDate)) {
        return NextResponse.json(
          { error: "acquittanceDate must be in YYYY-MM-DD format" },
          { status: 400 },
        );
      }

      const candidate = new Date(`${rawacquittanceDate}T00:00:00.000Z`);
      if (Number.isNaN(candidate.getTime())) {
        return NextResponse.json(
          { error: "acquittanceDate is invalid" },
          { status: 400 },
        );
      }

      parsedacquittanceDate = candidate;
    }

    await prisma.$transaction(async (tx) => {
      const acquittance = await tx.acquittance.findUnique({
        where: { id: acquittanceId },
      });

      if (!acquittance) {
        const err = new Error("acquittance not found");
        (err as any).code = "acquittance_NOT_FOUND";
        throw err;
      }

      const invoices = await tx.invoice.findMany({
        where: { id: { in: invoiceIds } },
        include: {
          OrderPO: { include: { bill: true } },
          acquittanceItem: { select: { acquittanceId: true } },
        },
      });

      if (invoices.length !== invoiceIds.length) {
        const err = new Error("Some invoices not found");
        (err as any).code = "INVOICE_NOT_FOUND";
        throw err;
      }

      for (const inv of invoices) {
        if (inv.OrderPO.customerId !== acquittance.customerId) {
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
          inv.acquittanceItem &&
          inv.acquittanceItem.acquittanceId !== acquittance.id
        ) {
          const err = new Error("Invoice already used in another acquittance");
          (err as any).code = "INVOICE_USED_OTHER_acquittance";
          (err as any).invoiceId = inv.id;
          throw err;
        }
      }

      await tx.acquittanceInvoice.deleteMany({
        where: { acquittanceId: acquittance.id },
      });

      await tx.acquittanceInvoice.createMany({
        data: invoiceIds.map((invoiceId) => ({
          acquittanceId: acquittance.id,
          invoiceId,
        })),
      });

      if (parsedacquittanceDate) {
        await tx.acquittance.update({
          where: { id: acquittance.id },
          data: { createdAt: parsedacquittanceDate },
        });
      }
    });

    const totals = await calcAcquittanceTotals(acquittanceId);

    return NextResponse.json({
      ok: true,
      acquittanceId,
      totals,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "acquittance_NOT_FOUND") {
      return NextResponse.json(
        { error: "acquittance not found" },
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

    if (error.code === "INVOICE_USED_OTHER_acquittance") {
      return NextResponse.json(
        {
          error: "One or more invoices already used in another acquittance",
          invoiceId: error.invoiceId,
        },
        { status: 400 },
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "One or more invoices already used in another acquittance" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update acquittance invoices" },
      { status: 500 },
    );
  }
}
