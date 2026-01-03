import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const ALLOWED_STATUS = new Set([
  "pending",
  "cutting",
  "weighing",
  "ready",
  "shipped",
  "completed",
  "canceled",
]);

function getBangkokDayRange() {
  // today range in Asia/Bangkok
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  const dateStr = `${y}-${m}-${d}`; // YYYY-MM-DD (Bangkok date)
  const start = new Date(`${dateStr}T00:00:00.000+07:00`);
  const end = new Date(`${dateStr}T23:59:59.999+07:00`);
  return { start, end, dateStr };
}

function getBangkokMonthRange() {
  // month range (current month) in Asia/Bangkok
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;

  const monthStartStr = `${y}-${m}-01`;
  const start = new Date(`${monthStartStr}T00:00:00.000+07:00`);

  // หาเดือนถัดไป
  const yearNum = Number(y);
  const monthNum = Number(m);
  const nextMonthYear = monthNum === 12 ? yearNum + 1 : yearNum;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextMonthStr = `${nextMonthYear}-${String(nextMonth).padStart(
    2,
    "0"
  )}-01`;
  const nextMonthStart = new Date(`${nextMonthStr}T00:00:00.000+07:00`);

  // end = ก่อนเริ่มเดือนถัดไป 1 ms
  const end = new Date(nextMonthStart.getTime() - 1);

  return { start, end, monthStr: `${y}-${m}` }; // YYYY-MM
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const qRaw = (searchParams.get("q") ?? "").trim();

  // status ส่งผิด -> ไม่กรอง
  const rawStatus = (searchParams.get("status") ?? "").trim();
  const status = ALLOWED_STATUS.has(rawStatus) ? rawStatus : "";

  const from = (searchParams.get("from") ?? "").trim(); // YYYY-MM-DD
  const to = (searchParams.get("to") ?? "").trim(); // YYYY-MM-DD

  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 10))
  );

  const where: Prisma.OrderPOWhereInput = {};

  // 1) status filter
  if (status) where.status = status as any;

  // 2) date range filter (createdAt)
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  // 3) search หลายคำ: ทุกคำต้อง match อย่างน้อย 1 ฟิลด์ (poNumber หรือ Customer.name)
  if (qRaw) {
    const tokens = qRaw
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    where.AND = tokens.map((token) => ({
      OR: [
        { poNumber: { contains: token, mode: "insensitive" } },
        { Customer: { name: { contains: token, mode: "insensitive" } } },
      ],
    }));
  }

  const skip = (page - 1) * pageSize;

  // ✅ Summary
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

  const [
    totalFiltered,
    rows,
    completedToday, // ✅ เสร็จวันนี้ (อิง completedAt)
    notCompletedTotal, // ✅ ยังไม่เสร็จ (ไม่รวม completed และไม่รวม canceled)
    ordersThisMonth, // ✅ ออเดอร์เดือนนี้ (ไม่รวม canceled)
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

    // ✅ ออเดอร์ที่สร้างในเดือนนี้ (ทั้งระบบ) อิง createdAt
    prisma.orderPO.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { not: "canceled" },
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
