import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
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
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Validate parameters
    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "กรุณาระบุปีและเดือน",
            details: {
              required: ["year", "month"],
            },
          },
        },
        { status: 400 },
      );
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);

    // Validate year
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_YEAR",
            message: "ปีไม่ถูกต้อง กรุณาระบุปีระหว่าง 2000-2100",
            details: {
              field: "year",
              provided: yearNumber,
              expected: "2000-2100",
            },
          },
        },
        { status: 400 },
      );
    }

    // Validate month
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MONTH",
            message: "เดือนไม่ถูกต้อง กรุณาระบุเดือนระหว่าง 1-12",
            details: {
              field: "month",
              provided: monthNumber,
              expected: "1-12",
            },
          },
        },
        { status: 400 },
      );
    }

    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const startOfMonth = new Date(yearNumber, monthNumber - 1, 1);
    const endOfMonth = new Date(yearNumber, monthNumber, 1);
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    // Get income data (from Bill)
    const incomeStats = await prisma.bill.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      _sum: {
        grandTotal: true,
      },
      _count: {
        id: true,
      },
    });

    // Get expense data
    const expenseStats = await prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get staff salary data for the selected month
    const salaryStats = await prisma.staffSalary.aggregate({
      where: {
        effectiveDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalIncome = incomeStats._sum.grandTotal || 0;
    const billCount = incomeStats._count.id || 0;
    const avgPerBill =
      billCount > 0 ? parseFloat((totalIncome / billCount).toFixed(2)) : 0;

    const totalExpenseFromExpense = expenseStats._sum.amount || 0;
    const totalSalary = salaryStats._sum.amount || 0;
    const totalExpense = totalExpenseFromExpense + totalSalary;
    const expenseItemCount = expenseStats._count.id || 0;
    const salaryItemCount = salaryStats._count.id || 0;
    const totalExpenseItemCount = expenseItemCount + salaryItemCount;
    const avgPerItem =
      totalExpenseItemCount > 0
        ? parseFloat((totalExpense / totalExpenseItemCount).toFixed(2))
        : 0;

    const netTotal = totalIncome - totalExpense;
    const netPercentage =
      totalIncome > 0
        ? parseFloat(((netTotal / totalIncome) * 100).toFixed(1))
        : 0;
    const profitMargin = netPercentage;

    // Calculate working days (excluding weekends)
    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNumber, monthNumber - 1, day);
      const dayOfWeek = date.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    const result = {
      success: true,
      data: {
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        year: yearNumber,
        income: {
          total: totalIncome,
          formatted: `฿${totalIncome.toLocaleString("en-US")}`,
          billCount,
          avgPerBill,
        },
        expense: {
          total: totalExpense,
          formatted: `฿${totalExpense.toLocaleString("en-US")}`,
          itemCount: totalExpenseItemCount,
          avgPerItem,
          salaryAmount: totalSalary,
          expenseAmount: totalExpenseFromExpense,
          salaryCount: salaryItemCount,
          expenseCount: expenseItemCount,
        },
        net: {
          total: netTotal,
          formatted: `฿${netTotal.toLocaleString("en-US")}`,
          percentage: netPercentage,
          profitMargin,
        },
      },
      meta: {
        totalDays: daysInMonth,
        workingDays,
        lastUpdated: new Date().toISOString(),
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "เกิดข้อผิดพลาดในการดึงข้อมูล",
          details: {
            message: String(error),
          },
        },
      },
      { status: 500 },
    );
  }
}
