import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const customers = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
      SELECT DISTINCT c.id, c.name
      FROM "Customer" c
      JOIN "OrderPO" o ON o."customerId" = c.id
      JOIN "Invoice" i ON i.codetoinvoice = o.codetoinvoice
      LEFT JOIN "StatementInvoice" si ON si."invoiceId" = i.id
      WHERE si."invoiceId" IS NULL
      ORDER BY c.name ASC
    `;

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers for statement:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะดึงข้อมูลลูกค้า" },
      { status: 500 },
    );
  }
}
