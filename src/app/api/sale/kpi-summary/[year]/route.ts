import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ year: number }> },
) {
  const { year } = await context.params;
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  if (!year || isNaN(Number(year))) {
    return NextResponse.json(
      { error: "Invalid year parameter" },
      { status: 400 },
    );
  }
  const { session } = authResult;
  console.log(session);
  try {
    const yearNumber = Number(year);
    const startOfYear = new Date(yearNumber, 0, 1); // January 1st
    const endOfYear = new Date(yearNumber + 1, 0, 1); // January 1st of next year

    // คำนวณยอดขายและจำนวนออเดอร์ที่สำเร็จ
    const orderStats = await prisma.orderPO.aggregate({
      where: {
        status: "completed",
        completedAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // คำนวณรายรับจาก Bill
    const revenueStats = await prisma.bill.aggregate({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      _sum: {
        grandTotal: true,
      },
    });

    // คำนวณรายจ่ายจาก Expense
    const expenseStats = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalSales = orderStats._sum.total || 0;
    const orderCount = orderStats._count.id || 0;
    const totalRevenue = revenueStats._sum.grandTotal || 0;
    const totalExpense = expenseStats._sum.amount || 0;
    const profit = totalRevenue - totalExpense;
    const profitPercentage =
      totalRevenue > 0
        ? parseFloat(((profit / totalRevenue) * 100).toFixed(1))
        : 0;

    const result = {
      success: true,
      data: {
        salesAmount: {
          total: totalSales,
          formatted: `฿${totalSales.toLocaleString("en-US")}`,
        },
        salesQuantity: {
          total: orderCount,
          formatted: orderCount.toLocaleString("en-US"),
        },
        income: {
          total: totalRevenue,
          formatted: `฿${totalRevenue.toLocaleString("en-US")}`,
        },
        expense: {
          total: totalExpense,
          formatted: `฿${totalExpense.toLocaleString("en-US")}`,
        },
        netProfit: {
          total: profit,
          formatted: `฿${profit.toLocaleString("en-US")}`,
          percentage: profitPercentage,
        },
      },
      meta: {
        year: yearNumber,
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPI summary: " + error },
      { status: 500 },
    );
  }
}
