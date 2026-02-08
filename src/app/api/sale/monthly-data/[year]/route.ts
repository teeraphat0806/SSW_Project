import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ year: string }> },
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
  const { session } = authResult;
  console.log(session);
  try {
    const yearNumber = Number(year);

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
              provided: year,
              expected: "2000-2100",
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

    const monthlyData = [];

    // Loop through each month
    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(yearNumber, month - 1, 1);
      const endOfMonth = new Date(yearNumber, month, 1);

      console.log(
        `Querying month ${month}: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`,
      );

      // Get sales data (from Bill)
      const salesStats = await prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
          OrderPO: {
            is: {
              status: "completed",
            },
          },
        },
        _sum: {
          grandTotal: true,
          subtotal: true,
          vat: true,
        },
        _count: {
          id: true,
        },
      });

      console.log(`Sales stats for month ${month}:`, salesStats);

      // Get all staff
      const allStaff = await prisma.staff.findMany({
        select: {
          id: true,
          currentSalary: true,
        },
      });

      // Get staff salaries for the month
      const staffSalaries = await prisma.staffSalary.findMany({
        where: {
          effectiveDate: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        orderBy: {
          effectiveDate: "desc", // Get latest first
        },
      });

      // Group by staffId and take only the latest one per staff
      const staffSalaryMap = new Map<number, number>();
      staffSalaries.forEach((salary) => {
        if (!staffSalaryMap.has(salary.staffId)) {
          staffSalaryMap.set(salary.staffId, salary.amount);
        }
      });

      // Calculate total salaries - one per staff
      const totalSalaries = allStaff.reduce((sum, staff) => {
        const salaryAmount = staffSalaryMap.has(staff.id)
          ? staffSalaryMap.get(staff.id)!
          : staff.currentSalary;
        return sum + salaryAmount;
      }, 0);

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
      });

      const salesAmt = salesStats._sum.grandTotal || 0;
      const subtotal = salesStats._sum.subtotal || 0;
      const vat = salesStats._sum.vat || 0;
      const salesQty = salesStats._count.id || 0;
      const income = salesStats._sum.grandTotal || 0; // Income = Sales from Bill
      const expenseAmount = expenseStats._sum.amount || 0;
      const expense = expenseAmount + totalSalaries; // Include salaries in expense
      const net = income - expense;

      monthlyData.push({
        month,
        monthName: monthNames[month - 1],
        salesAmt,
        subtotal,
        vat,
        salesQty,
        income,
        expense,
        net,
        formatted: {
          salesAmt: `฿${salesAmt.toLocaleString("en-US")}`,
          subtotal: `฿${subtotal.toLocaleString("en-US")}`,
          vat: `฿${vat.toLocaleString("en-US")}`,
          salesQty: `${salesQty}`,
          income: `฿${income.toLocaleString("en-US")}`,
          expense: `฿${expense.toLocaleString("en-US")}`,
          net: `฿${net.toLocaleString("en-US")}`,
        },
      });
    }

    const result = {
      success: true,
      data: monthlyData,
      meta: {
        year: yearNumber,
        totalMonths: 12,
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
