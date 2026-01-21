import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await prisma.$executeRaw`
    SELECT "billId", COUNT(*) AS cnt
FROM "OrderPO"
WHERE "billId" IS NOT NULL
GROUP BY "billId"
HAVING COUNT(*) > 1;
`;

  return NextResponse.json({
    updated: result,
  });
}
