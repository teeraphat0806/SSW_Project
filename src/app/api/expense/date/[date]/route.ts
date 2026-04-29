import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ date: string }> },
) {
  const { date } = await context.params;
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);
  if ("response" in authResult) {
    return authResult.response;
  }
  if (!date || date.trim() === "") {
    return new Response(
      JSON.stringify({ error: "Date parameter is required" }),
      { status: 400 },
    );
  }
  try {
    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: new Date(`${date}T00:00:00Z`) } },
      include: {
        category: true,
        staff: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    return new NextResponse(
      JSON.stringify({
        expenses: expenses.map((expense) => ({
          ...expense,
          staff: expense.staff
            ? {
                id: expense.staff.id,
                name: expense.staff.user?.name || "ไม่ระบุชื่อพนักงาน",
              }
            : null,
        })),
      }),
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(
      JSON.stringify({ error: `Internal Server Error: ${message}` }),
      {
        status: 500,
      },
    );
  }
}
