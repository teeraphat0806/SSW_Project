import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TotalsRow = {
  acquittanceId: number;
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

  const q = (searchParams.get("q") ?? "").trim(); // acquittanceNo ตรงตัว
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { customerId };

  if (q) {
    const n = Number(q);
    if (!Number.isNaN(n)) where.acquittanceNo = n;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [total, acquittances] = await prisma.$transaction([
    prisma.acquittance.count({ where }),
    prisma.acquittance.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        acquittanceNo: true,
        customerId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  if (acquittances.length === 0) {
    return NextResponse.json({
      customerId,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: [],
    });
  }

  const ids = acquittances.map((a) => a.id);

  const totalsRows = await prisma.$queryRaw<TotalsRow[]>(Prisma.sql`
    SELECT
      ai."acquittanceId"::int AS "acquittanceId",
      COUNT(*)::int AS "invoiceCount",
      COALESCE(SUM(COALESCE(b."subtotal", 0)), 0)::float8 AS "subtotal",
      COALESCE(SUM(COALESCE(b."vat", 0)), 0)::float8 AS "vat",
      COALESCE(SUM(COALESCE(b."discount", 0)), 0)::float8 AS "discount",
      COALESCE(SUM(COALESCE(b."grandTotal", 0)), 0)::float8 AS "grandTotal"
    FROM "AcquittanceInvoice" ai
    JOIN "Invoice" i ON i."id" = ai."invoiceId"
    JOIN "OrderPO" po ON po."codetoinvoice" = i."codetoinvoice"
    LEFT JOIN "Bill" b ON b."id" = po."billId"
    WHERE ai."acquittanceId" IN (${Prisma.join(ids)})
    GROUP BY ai."acquittanceId"
  `);

  const totalsMap = new Map<number, TotalsRow>();
  for (const r of totalsRows) totalsMap.set(r.acquittanceId, r);

  const data = acquittances.map((a) => {
    const t = totalsMap.get(a.id);
    return {
      ...a,
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
