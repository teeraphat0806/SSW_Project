import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TotalsRow = {
  statementId: number;
  invoiceCount: number;
  subtotal: number;
  vat: number;
  discount: number;
  grandTotal: number;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  const customerId = Number(params.id);
  if (!customerId)
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 20)),
  );
  const skip = (page - 1) * pageSize;

  const q = (searchParams.get("q") ?? "").trim(); // statementNo ตรงตัว
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date

  const where: any = { customerId };

  if (q) {
    const n = Number(q);
    if (!Number.isNaN(n)) where.statementNo = n;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [total, statements] = await prisma.$transaction([
    prisma.statement.count({ where }),
    prisma.statement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        statementNo: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  // ถ้าไม่มีข้อมูล ก็คืนเร็ว ๆ
  if (statements.length === 0) {
    return NextResponse.json({
      customerId,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: [],
    });
  }

  const ids = statements.map((s) => s.id);

  // ✅ Aggregate ยอดจาก Bill ตาม schema ล่าสุด:
  // StatementInvoice -> Invoice -> OrderPO (via codetoinvoice) -> Bill (via billId)
  const totalsRows = await prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
    SELECT
      si."statementId"::int AS "statementId",
      COUNT(*)::int AS "invoiceCount",
      COALESCE(SUM(COALESCE(b."subtotal", 0)), 0)::float8 AS "subtotal",
      COALESCE(SUM(COALESCE(b."vat", 0)), 0)::float8 AS "vat",
      COALESCE(SUM(COALESCE(b."discount", 0)), 0)::float8 AS "discount",
      COALESCE(SUM(COALESCE(b."grandTotal", 0)), 0)::float8 AS "grandTotal"
    FROM "StatementInvoice" si
    JOIN "Invoice" i ON i."id" = si."invoiceId"
    JOIN "OrderPO" po ON po."codetoinvoice" = i."codetoinvoice"
    LEFT JOIN "Bill" b ON b."id" = po."billId"
    WHERE si."statementId" IN (${Prisma.join(ids)})
    GROUP BY si."statementId"
  `);

  const totalsMap = new Map<number, TotalsRow>();
  for (const r of totalsRows) totalsMap.set(r.statementId, r);

  const data = statements.map((s) => {
    const t = totalsMap.get(s.id);
    return {
      ...s,
      invoiceCount: t?.invoiceCount ?? 0,
      subtotal: t?.subtotal ?? 0,
      vat: t?.vat ?? 0,
      discount: t?.discount ?? 0,
      grandTotal: t?.grandTotal ?? 0,
    };
  });

  return NextResponse.json({
    customerId,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
}
