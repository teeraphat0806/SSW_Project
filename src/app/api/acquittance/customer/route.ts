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
    const customers = await prisma.customer.findMany({
      where: {
        OrderPO: {
          some: {
            customerId: { not: null },
            Invoice: {
              is: {
                acquittanceItem: null,
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers for acquittance:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะดึงข้อมูลลูกค้า" },
      { status: 500 },
    );
  }
}
