// app/api/payroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

// GET /api/payroll/[id]
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  if (
    !session ||
    !["superadmin", "supervisor", "clerk"].includes(session.user?.role)
  ) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
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
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to run SQL: ${error?.message ?? String(error)}` },
      { status: 500 }
    );
  }
}
