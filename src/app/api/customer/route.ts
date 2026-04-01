// src/app/api/customer/route.ts
import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { CustomerSchema } from "../../../lib/schemas/customer.schema";
import { Prisma } from "@prisma/client";
import { digitsOnly } from "@/lib/calculateGrandTotal";

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

    // mode=select → เอาไว้โชว์รายการให้เลือก (ไม่ต้อง paginate แบบตาราง)
    const mode = (searchParams.get("mode") ?? "").trim(); // "select" | ""
    const isSelectMode = mode === "select";

    // pagination
    const page = toInt(searchParams.get("page"), 1);

    const pageSize = isSelectMode
      ? clamp(toInt(searchParams.get("pageSize"), 100), 1, 300)
      : clamp(toInt(searchParams.get("pageSize"), 10), 1, 20);

    // search by name
    const search = (searchParams.get("search") ?? "").trim();
    // sort
    const { key: sortKey, dir } = parseSort(searchParams.get("sort"));

    const searchDigits = digitsOnly(search);
    const where: Prisma.CustomerWhereInput =
      search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { taxNumber: { contains: search, mode: "insensitive" } },
              { tel: { contains: search, mode: "insensitive" } },
              ...(searchDigits
                ? [
                    {
                      telSearch: {
                        contains: searchDigits,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      faxNumberSearch: {
                        contains: searchDigits,
                        mode: "insensitive" as const,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {};

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const orderBy =
      sortKey === "billCount"
        ? ({ Bill: { _count: dir } } as const)
        : ({ [sortKey]: dir } as Record<string, "asc" | "desc">);

    if (isSelectMode) {
      const orderBySelect =
        search.length > 0
          ? ({ name: "asc" } as const)
          : ({ Bill: { _count: dir } } as const);

      const data = await prisma.customer.findMany({
        where,
        orderBy: orderBySelect,
        skip: 0, //  dropdown ไม่ต้องแบ่งหน้า
        take, //  โชว์เยอะๆไว้เลือกอะ
        select: {
          id: true,
          name: true,
          credit: true,
          tel: true,
          telSearch: true,
          taxNumber: true,
        },
      });

      return NextResponse.json({ data }, { status: 200 });
    }
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
          credit: true,
          tel: true,
          email: true,
          taxNumber: true,
          faxNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { Bill: true, OrderPO: true, quotation: true } }, // เอาไว้โชว์ในตาราง

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
            quotationCount: c._count.quotation,
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
  const body = await req.json();
  const parsed = CustomerSchema.safeParse(body);

  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    let telSearch = null;
    if (parsed.data.tel) {
      telSearch = digitsOnly(parsed.data.tel);
    }
    let faxNumberSearch = null;
    if (parsed.data.faxNumber) {
      faxNumberSearch = digitsOnly(parsed.data.faxNumber);
    }
    const data: Prisma.CustomerCreateInput = {
      name: parsed.data.name,
      address: parsed.data.address,
      credit: parsed.data.credit ?? 0,
      tel: parsed.data.tel,
      telSearch: telSearch,
      taxNumber: parsed.data.taxNumber,
      faxNumber: parsed.data.faxNumber,
      faxNumberSearch: faxNumberSearch,
      email: parsed.data.email,
    };

    // ตรวจสอบว่ามีข้อมูลซ้ำหรือไม่
    const uniqueChecks: Prisma.CustomerWhereInput[] = [];
    if (data.name) uniqueChecks.push({ name: data.name });
    //ดึงข้อมูลที่ซ้ำ
    const existed = await prisma.customer.findMany({
      where: { OR: uniqueChecks },
      select: {
        name: true,
      },
    });

    // ตรวจสอบว่ามีข้อมูลซ้ำหรือไม่
    const duplicatedFields: string[] = [];

    if (existed.some((c) => c.name === data.name)) {
      duplicatedFields.push("name");
    }
    if (duplicatedFields.length > 0) {
      const fieldLabelMap: Record<string, string> = {
        name: "ชื่อลูกค้า",
        // taxNumber: "เลขผู้เสียภาษี",
        // tel: "เบอร์โทร",
        // faxNumber: "แฟกซ์",
        // email: "อีเมล",
      };
      const firstField = duplicatedFields[0];
      return NextResponse.json(
        {
          error: "duplicate_customer",
          message: `ข้อมูลลูกค้าซ้ำในระบบ (${fieldLabelMap[firstField] ?? firstField})`,
          field: firstField,
          fields: duplicatedFields,
        },
        { status: 409 },
      );
    }
    // ถ้าไม่มีข้อมูลซ้ำ ให้สร้างลูกค้าใหม่
    const result = await prisma.customer.create({
      data: data,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const rawTargets = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[])
        : typeof error.meta?.target === "string"
          ? [error.meta.target]
          : [];
      const haystack = `${rawTargets.join(" ")} ${error.message}`.toLowerCase();
      let field = "ข้อมูล";
      if (haystack.includes("taxnumber")) field = "taxNumber";
      else if (haystack.includes("telsearch") || haystack.includes("tel"))
        field = "tel";
      else if (
        haystack.includes("faxnumbersearch") ||
        haystack.includes("faxnumber")
      )
        field = "faxNumber";
      else if (haystack.includes("email")) field = "email";

      const fieldLabelMap: Record<string, string> = {
        taxNumber: "เลขผู้เสียภาษี",
        tel: "เบอร์โทร",
        telSearch: "เบอร์โทร",
        faxNumber: "แฟกซ์",
        faxNumberSearch: "แฟกซ์",
        email: "อีเมล",
      };

      const fieldLabel = fieldLabelMap[field] ?? field;
      return NextResponse.json(
        {
          error: "duplicate_customer",
          message: `ข้อมูลลูกค้าซ้ำในระบบ (${fieldLabel})`,
          field,
        },
        { status: 409 },
      );
    }

    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create Customer" },
      { status: 500 },
    );
  }
}
