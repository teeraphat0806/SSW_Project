import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
// GET /api/payroll/[id]
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  try {
    const result = await prisma.staffIncome.findMany({
      where: { staffId: Number(id) },
      include: {
        Staff: {
          select: {
            jobPosition: true,
            bankAccount: true,
            startDate: true,
            code: true,
            social_security: true,
            currentSalary: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.log("error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch payrolls" },
      { status: 500 },
    );
  }
}
