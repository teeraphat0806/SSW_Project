import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(["superadmin", "accountant", "clerk"]);
  if ("response" in authResult) return authResult.response;
  const { id } = await context.params;
  const customerId = Number(id);
  if (Number.isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const pageParam = searchParams.get("page");
  const excludeStatementUsed =
    searchParams.get("excludeStatementUsed") === "true";
  const excludeAcquittanceUsed =
    searchParams.get("excludeAcquittanceUsed") === "true";

  const limit = limitParam ? Number(limitParam) : 10;
  const page = pageParam ? Number(pageParam) : 1;
  const usePagination = limitParam !== null && pageParam !== null;

  if (
    usePagination &&
    (!Number.isFinite(limit) ||
      !Number.isFinite(page) ||
      limit <= 0 ||
      page <= 0)
  ) {
    return NextResponse.json(
      { error: "limit and page must be positive numbers" },
      { status: 400 },
    );
  }

  try {
    const where = {
      OrderPO: {
        customerId,
      },
      ...(excludeStatementUsed ? { statementItem: null } : {}),
      ...(excludeAcquittanceUsed ? { acquittanceItem: null } : {}),
    };

    const [total, invoices] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        select: {
          id: true,
          invoiceNo: true,
          createdAt: true,
          codetoinvoice: true,
          OrderPO: {
            select: {
              id: true,
              poNumber: true,
              billId: true,
              bill: {
                select: {
                  grandTotal: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        ...(usePagination
          ? {
              skip: (page - 1) * limit,
              take: limit,
            }
          : {}),
      }),
    ]);

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      createdAt: invoice.createdAt.toISOString().split("T")[0],
      codetoinvoice: invoice.codetoinvoice,
      orderPOId: invoice.OrderPO?.id ?? null,
      poNumber: invoice.OrderPO?.poNumber ?? null,
      billId: invoice.OrderPO?.billId ?? null,
      grandTotal: invoice.OrderPO?.bill?.grandTotal ?? 0,
    }));

    if (usePagination) {
      return NextResponse.json({
        items: formattedInvoices,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะดึงข้อมูลใบแจ้งหนี้" },
      { status: 500 },
    );
  }
}
