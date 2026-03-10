import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const TIME_ZONE = "Asia/Bangkok" as const;

const ALLOWED_STATUS = new Set([
  "pending",
  "cutting",
  "weighing",
  "ready",
  "shipped",
  "completed",
  "canceled",
]);

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getBangkokDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return { y, m, d };
}

function getBangkokDayRange(date = new Date()) {
  const { y, m, d } = getBangkokDateParts(date);
  const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (Bangkok)

  const start = new Date(`${dateStr}T00:00:00.000+07:00`);
  const end = new Date(`${dateStr}T23:59:59.999+07:00`);
  return { start, end, dateStr };
}

function getBangkokMonthRange(date = new Date()) {
  const { y, m } = getBangkokDateParts(date);

  const monthStartStr = `${y}-${m}-01`;
  const start = new Date(`${monthStartStr}T00:00:00.000+07:00`);

  const yearNum = Number(y);
  const monthNum = Number(m);

  const nextMonthYear = monthNum === 12 ? yearNum + 1 : yearNum;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;

  const nextMonthStr = `${nextMonthYear}-${pad2(nextMonth)}-01`;
  const nextMonthStart = new Date(`${nextMonthStr}T00:00:00.000+07:00`);
  const end = new Date(nextMonthStart.getTime() - 1);

  return { start, end, monthStr: `${y}-${m}` }; // YYYY-MM
}

function toTokens(q: string) {
  return q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function buildWhere({
  status,
  invoice,
  from,
  to,
  search,
}: {
  status: string;
  invoice: string;
  from: string;
  to: string;
  search: string;
}): Prisma.OrderPOWhereInput {
  const where: Prisma.OrderPOWhereInput = {};

  // 1) status
  if (status) where.status = status as any;

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
        { poNumber: { contains: token, mode: "insensitive" } },
        { Customer: { name: { contains: token, mode: "insensitive" } } },
      ];

      const numToken = Number(token);
      if (!Number.isNaN(numToken)) {
        orConditions.push({ codetoinvoice: numToken }); // หรือ { codetoinvoice: { equals: numToken } }
        orConditions.push({ Invoice: { is: { invoiceNo: numToken } } });
      }

      return { OR: orConditions };
    });
  }

  where.bill = { NOT: null }; // ต้องมีบิลถึงจะนับยอดรวมใน dashboard

  return where;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // --- Read params ---
  const search = (searchParams.get("search") ?? "").trim();

  const rawInvoice = (searchParams.get("invoice") ?? "").trim();
  const Invoice = ["pending", "invoiced"].includes(rawInvoice)
    ? rawInvoice
    : "";

  const rawStatus = (searchParams.get("status") ?? "").trim();
  const status = ALLOWED_STATUS.has(rawStatus) ? rawStatus : "";

  const from = (searchParams.get("from") ?? "").trim(); // YYYY-MM-DD
  const to = (searchParams.get("to") ?? "").trim(); // YYYY-MM-DD

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 10)),
  );

  const skip = (page - 1) * pageSize;

  // --- Build filters ---
  const where = buildWhere({ search, status, invoice: Invoice, from, to });

  // --- Summary date ranges (Bangkok) ---
  const {
    start: todayStart,
    end: todayEnd,
    dateStr: todayBangkok,
  } = getBangkokDayRange();

  const {
    start: monthStart,
    end: monthEnd,
    monthStr: monthBangkok,
  } = getBangkokMonthRange();

  // --- Queries ---
  const [
    totalFiltered,
    rows,
    completedToday,
    notCompletedTotal,
    ordersThisMonth,
  ] = await Promise.all([
    prisma.orderPO.count({ where }),

    prisma.orderPO.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        poNumber: true,
        status: true,
        total: true,
        createdAt: true,
        codetoinvoice: true,
        Invoice: { select: { invoiceNo: true } },
        Customer: { select: { name: true } },
        bill: { select: { grandTotal: true } },
      },
    }),

    // completed วันนี้ (อิง completedAt)
    prisma.orderPO.count({
      where: {
        status: "completed",
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    }),

    // ทั้งหมดที่ยังไม่ completed (ทั้งระบบ)
    prisma.orderPO.count({
      where: {
        status: { in: ["pending", "cutting", "weighing", "ready", "shipped"] },
      },
    }),

    // ออเดอร์ที่สร้างในเดือนนี้ (ทั้งระบบ) ไม่รวม canceled
    prisma.orderPO.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { not: "canceled" },
      },
    }),
  ]);

  // --- Response mapping ---
  const data = rows.map((r) => ({
    id: r.id,
    poNumber: r.poNumber,
    status: r.status,
    codetoinvoice: r.codetoinvoice,
    invoiceNo: r.Invoice?.invoiceNo ?? null,
    customerName: r.Customer?.name ?? null,
    grandTotal: r.bill?.grandTotal ?? r.total,
    createdAt: r.createdAt.toISOString(),
  }));

  return Response.json({
    summary: {
      completedToday,
      notCompletedTotal,
      ordersThisMonth,
      todayBangkok,
      monthBangkok,
    },
    data,
    pagination: {
      page,
      pageSize,
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / pageSize),
    },
  });
}
