// src/app/api/dashboard/route.ts
import prisma from "@/lib/prisma";

const ALLOWED_STATUS = new Set([
  "pending",
  "cutting",
  "weighing",
  "ready",
  "shipped",
  "completed",
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const status = searchParams.get("status") ?? "";
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");     // YYYY-MM-DD

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 20))
  );

  const where: any = {};

  // status filter
  if (status) {
    if (!ALLOWED_STATUS.has(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    where.status = status;
  }

  // date range filter (createdAt)
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from + "T00:00:00.000Z");
    if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
  }

  // text search filter (customer name OR poNumber)
  if (q) {
    where.OR = [
      { poNumber: { contains: q, mode: "insensitive" } },
      { Customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.orderPO.count({ where }),
    prisma.orderPO.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        poNumber: true,
        status: true,
        total: true,
        createdAt: true,
        Customer: { select: { name: true } },
        bill: { select: { grandTotal: true } },
      },
    }),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    poNumber: r.poNumber,
    status: r.status,
    customerName: r.Customer?.name ?? null,
    grandTotal: r.bill?.grandTotal ?? r.total,
    createdAt: r.createdAt.toISOString(),
  }));

  return Response.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
