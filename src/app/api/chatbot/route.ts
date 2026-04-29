// app/api/payroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ปรับ policy ที่นี่ได้ (เพิ่มชื่อ table/view ที่อนุญาต)
const ALLOWED_TABLES_OR_VIEWS = [
  "Staff",
  "OrderPO",
  "Customer",
  "Bill",
  "Product",
  "SteelType",
  "StaffIncome",
  // เพิ่มตามต้องการ...
];
const INTERNAL_SECRET = process.env.INTERNAL_SQL_API_SECRET!;
function looksSafeSelect(sql: string) {
  const s = sql.trim();

  // ต้องขึ้นต้นด้วย SELECT (case-insensitive)
  if (!/^\s*select\b/i.test(s)) return false;

  // ห้ามมี ; หรือ comment patterns
  if (/[;]|--|\/\*/.test(s)) return false;

  // ตรวจสอบว่ามีการอ้างอิงตาราง/วิวที่อนุญาตอย่างน้อยหนึ่งตัว (optional but safer)
  const mentionsAllowed = ALLOWED_TABLES_OR_VIEWS.some((t) => {
    const re = new RegExp(`\\b"${t}"\\b|\\b${t}\\b`, "i");
    return re.test(s);
  });
  if (!mentionsAllowed) return false;

  return true;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const sql = req.nextUrl.searchParams.get("sql");
  if (!sql) {
    return NextResponse.json(
      { error: "Missing `sql` query parameter" },
      { status: 400 }
    );
  }

  if (!looksSafeSelect(sql)) {
    return NextResponse.json(
      {
        error:
          "Rejected SQL: only simple SELECTs on allowed tables/views are permitted; no ;, --, or /* */ allowed.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$queryRawUnsafe(sql);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to run SQL` },
      { status: 500 }
    );
  }
}
