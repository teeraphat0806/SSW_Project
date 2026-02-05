// src/app/api/customer/route.ts
import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { CustomerSchema } from "../../../lib/schemas/customer.schema";
import { Prisma } from "@prisma/client";

//กำหนดชนิดของพารามิเตอร์ที่รับเข้ามา
function toInt(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

//จำกัดค่าตัวเลขให้อยู่ในช่วง min - max
function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(max, number));
}

type SortKey = "name" | "createdAt" | "billCount";

// asc คน้อยไปมาก desc มากไปน้อย
type SortOrder = "asc" | "desc";

function parseSort(sortRaw: string | null): { key: SortKey; dir: SortOrder } {
  const fallback = { key: "billCount" as const, dir: "desc" as const };

  if (!sortRaw) return fallback;
  const [k, d] = sortRaw.split("-");

  const key = (k as SortKey) || fallback.key;
  const dir = d === "asc" ? "asc" : d === "desc" ? "desc" : fallback.dir;

  const allow: SortKey[] = ["name", "createdAt", "billCount"];
  if (!allow.includes(key)) return fallback;

  return { key, dir };
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);

    // pagination
    const page = toInt(searchParams.get("page"), 1);
    const pageSize = clamp(toInt(searchParams.get("pageSize"), 10), 1, 20);

    // search by name
    const search = (searchParams.get("search") ?? "").trim();
    // sort
    const { key: sortKey, dir } = parseSort(searchParams.get("sort"));

    const where: Prisma.CustomerWhereInput =
      search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },

              { tel: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const orderBy =
      sortKey === "billCount"
        ? ({ Bill: { _count: dir } } as const)
        : ({ [sortKey]: dir } as Record<string, "asc" | "desc">);

    const [total, data] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          tel: true,
          email: true,
          taxNumber: true,
          faxNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { Bill: true, OrderPO: true } }, // เอาไว้โชว์ในตาราง

          Bill: {
            select: { id: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const now = new Date();
    console.log("customer data fetched:", data);
    return NextResponse.json(
      {
        data: data.map((c) => {
          const lastBill = c.Bill?.[0];
          const lastDate = lastBill?.createdAt ?? null;

          const daysSinceLastBill = lastDate
            ? Math.floor(
                (now.getTime() - new Date(lastDate).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;

          return {
            ...c,
            billCount: c._count.Bill,
            orderCount: c._count.OrderPO,
            daysSinceLastBill,
          };
        }),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        meta: {
          search,
          sort: `${sortKey}-${dir}`,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("failed to fetch customer-dashboard data: " + error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data: " + error },
      { status: 500 },
    );
  }
}



export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
  const parsed = CustomerSchema.safeParse(body); // ✅ ตรวจสอบ schema

  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const result = await prisma.customer.create({
      data: parsed.data,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create Customer" },
      { status: 500 },
    );
  }
}
