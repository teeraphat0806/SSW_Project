import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function toTokens(q: string) {
  return q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildWhere({
  bill,
  invoice,
  from,
  to,
  search,
}: {
  bill: string;
  invoice: string;
  from: string;
  to: string;
  search: string;
}): Prisma.OrderPOWhereInput {
  const where: Prisma.OrderPOWhereInput = {};

  // 1) bill status
  if (bill === "billed") {
    where.billId = { not: null };
  } else if (bill === "unbilled") {
    where.billId = null;
  }

  // 1.1) invoice status
  if (invoice === "invoiced") {
    where.Invoice = { isNot: null };
  } else if (invoice === "pending") {
    where.Invoice = { is: null };
  }

  // 2) date range (createdAt)
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000+07:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999+07:00`);
  }

  // 3) multi-keyword search
  if (search) {
    const tokens = toTokens(search);

    where.AND = tokens.map((token) => {
      const orConditions: any[] = [
        { Customer: { name: { contains: token, mode: "insensitive" } } },
        {
          Quotation: {
            is: { customerName: { contains: token, mode: "insensitive" } },
          },
        },
        {
          Quotation: {
            is: { quotationNo: { contains: token, mode: "insensitive" } },
          },
        },
        {
          Quotation: {
            is: { companyName: { contains: token, mode: "insensitive" } },
          },
        },
      ];

      const numToken = Number(token);
      if (!Number.isNaN(numToken)) {
        orConditions.push({ codetoinvoice: numToken }); // หรือ { codetoinvoice: { equals: numToken } }
        orConditions.push({ Invoice: { is: { invoiceNo: numToken } } });
      }

      return { OR: orConditions };
    });
  }
  where.quotationId = { gt: 0 };

  return where;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawBill = (searchParams.get("bill") ?? "").trim();
  const bill = ["billed", "unbilled"].includes(rawBill) ? rawBill : "";
  const rawInvoice = (searchParams.get("invoice") ?? "").trim();
  const invoice = ["pending", "invoiced"].includes(rawInvoice)
    ? rawInvoice
    : "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const search = searchParams.get("search") || "";

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 10)),
  );

  const skip = (page - 1) * pageSize;

  const where = buildWhere({ bill, invoice, from, to, search });

  try {
    const [totalFiltered, rows] = await Promise.all([
      prisma.orderPO.count({ where }),
      prisma.orderPO.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          codetoinvoice: true,
          createdAt: true,
          Invoice: { select: { invoiceNo: true } },
          Quotation: {
            select: {
              quotationNo: true,
              customerName: true,
              companyName: true,
            },
          },
          billId: true,
        },
      }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      codetoinvoice: row.codetoinvoice,
      quotationNo: row.Quotation?.quotationNo ?? null,
      invoiceNo: row.Invoice?.invoiceNo ?? null,
      customerName: row.Quotation?.customerName ?? null,
      companyName: row.Quotation?.companyName ?? null,
      billStatus: row.billId ? "billed" : "unbilled",
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / pageSize),
      },
    });
  } catch (error) {
    console.error("cannot fetch quotation data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
