import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await prisma.$queryRaw`
SELECT
  "OrderPO".id AS orderPO_id,
  "Bill".id AS bill_id,
  "OrderPO".*,    -- (เลือกแสดงข้อมูล PO ทั้งหมด)
  "Bill".* -- (เลือกแสดงข้อมูล Bill ทั้งหมด)
FROM "OrderPO"
INNER JOIN "Bill" ON "OrderPO"."billId" = "Bill".id;

`;

  return NextResponse.json({
    data: result,
  });
}
