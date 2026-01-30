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

    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
    const dailyData = [];
    let totalIncome = 0;
    let totalExpense = 0;

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const startOfDay = new Date(yearNumber, monthNumber - 1, day);
      const endOfDay = new Date(yearNumber, monthNumber - 1, day + 1);

      // Get income data (from Bill)
      const incomeStats = await prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        _sum: {
          grandTotal: true,
        },
      });

      // Get expense data
      const expenseStats = await prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const income = incomeStats._sum.grandTotal || 0;
      const expense = expenseStats._sum.amount || 0;
      const net = income - expense;

      // Only add days that have data
      if (income > 0 || expense > 0) {
        dailyData.push({
          day,
          date: startOfDay.toISOString().split("T")[0],
          income,
          expense,
          net,
          formatted: {
            income: `฿${income.toLocaleString("en-US")}`,
            expense: `฿${expense.toLocaleString("en-US")}`,
            net: `฿${net.toLocaleString("en-US")}`,
          },
        });

        totalIncome += income;
        totalExpense += expense;
      }
    }

    const totalNet = totalIncome - totalExpense;

    const result = {
      success: true,
      data: dailyData,
      meta: {
        year: yearNumber,
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        totalDays: daysInMonth,
        totalIncome,
        totalExpense,
        totalNet,
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
