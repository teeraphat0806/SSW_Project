import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { getSalaryForPeriod } from "@/lib/salary-expense-utils";

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
    const searchParams = req.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "กรุณาระบุปีและเดือน",
            details: { required: ["year", "month"] },
          },
        },
        { status: 400 },
      );
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);

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

    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MONTH",
            message: "เดือนไม่ถูกต้อง กรุณาระบุเดือนระหว่าง  1-12",
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
    const endOfMonthExclusive = new Date(yearNumber, monthNumber, 1);
    const endOfMonth = new Date(endOfMonthExclusive.getTime() - 1);
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    const [
      incomeStats,
      expenseStats,
      allStaff,
      employmentsFromDB,
      salariesFromDB,
    ] = await Promise.all([
      prisma.bill.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lt: endOfMonthExclusive },
          OrderPO: {
            is: {
              status: { not: "canceled" },
              Invoice: { isNot: null },
            },
          },
        },
        _sum: {
          grandTotal: true,
          subtotal: true,
          vat: true,
        },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: { gte: startOfMonth, lt: endOfMonthExclusive },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.staff.findMany({
        select: {
          id: true,
          currentSalary: true,
          startDate: true,
          hireStatus: true,
          TerminationDate: true,
        },
      }),
      prisma.staffEmployment.findMany({
        where: {
          startDate: { lte: endOfMonth },
          OR: [{ endDate: null }, { endDate: { gte: startOfMonth } }],
        },
        select: {
          staffId: true,
          startDate: true,
          endDate: true,
        },
        orderBy: [{ staffId: "asc" }, { startDate: "desc" }],
      }),
      prisma.staffSalary.findMany({
        where: {
          effectiveDate: { lte: endOfMonth },
        },
        select: {
          staffId: true,
          amount: true,
          effectiveDate: true,
        },
        orderBy: [{ staffId: "asc" }, { effectiveDate: "desc" }],
      }),
    ]);

    const employmentMap = new Map<
      number,
      (typeof employmentsFromDB)[number][]
    >();
    for (const employment of employmentsFromDB) {
      const current = employmentMap.get(employment.staffId) ?? [];
      current.push(employment);
      employmentMap.set(employment.staffId, current);
    }

    const staffSalaryMap = new Map<number, (typeof salariesFromDB)[number][]>();
    for (const salary of salariesFromDB) {
      const current = staffSalaryMap.get(salary.staffId) ?? [];
      current.push(salary);
      staffSalaryMap.set(salary.staffId, current);
    }

    let totalSalary = 0;
    let salaryItemCount = 0;
    for (const staff of allStaff) {
      const amount = getSalaryForPeriod(
        {
          staff,
          employments: employmentMap.get(staff.id) ?? [],
          salaries: staffSalaryMap.get(staff.id) ?? [],
        },
        startOfMonth,
        endOfMonth,
      );
      if (amount == null) continue;
      totalSalary += amount;
      salaryItemCount++;
    }

    const totalIncome = incomeStats._sum.grandTotal || 0;
    const totalSubtotal = incomeStats._sum.subtotal || 0;
    const totalTax = incomeStats._sum.vat || 0;
    const billCount = incomeStats._count.id || 0;
    const avgPerBill =
      billCount > 0 ? parseFloat((totalIncome / billCount).toFixed(2)) : 0;

    const totalExpenseFromExpense = expenseStats._sum.amount || 0;
    const totalExpense = totalExpenseFromExpense + totalSalary;
    const expenseItemCount = expenseStats._count.id || 0;
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

    const customerPurchases = await prisma.bill.groupBy({
      by: ["customerId"],
      where: {
        createdAt: { gte: startOfMonth, lt: endOfMonthExclusive },
        OrderPO: {
            is: {
              status: { not: "canceled" },
              Invoice: { isNot: null },
            },
          },
      },
      _count: { id: true },
      _sum: { grandTotal: true },
      orderBy: {
        _sum: {
          grandTotal: "desc",
        },
      },
      take: 1,
    });

    let topCustomer = null;
    if (customerPurchases.length > 0) {
      const topCustomerData = customerPurchases[0];
      const customer = await prisma.customer.findUnique({
        where: { id: topCustomerData.customerId },
        select: {
          id: true,
          name: true,
          taxNumber: true,
        },
      });
      if (customer) {
        topCustomer = {
          id: customer.id,
          name: customer.name,
          taxNumber: customer.taxNumber,
          purchaseCount: topCustomerData._count.id,
          totalAmount: topCustomerData._sum.grandTotal || 0,
          formatted: {
            purchaseCount: topCustomerData._count.id.toLocaleString("en-US"),
            totalAmount: `฿${(topCustomerData._sum.grandTotal || 0).toLocaleString("en-US")}`,
          },
        };
      }
    }

    let workingDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNumber, monthNumber - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          month: monthNumber,
          monthName: monthNames[monthNumber - 1],
          year: yearNumber,
          income: {
            total: totalIncome,
            formatted: `฿${totalIncome.toLocaleString("en-US")}`,
            subtotal: totalSubtotal,
            subtotalFormatted: `฿${totalSubtotal.toLocaleString("en-US")}`,
            totalTax: totalTax,
            totalTaxFormatted: `฿${totalTax.toLocaleString("en-US")}`,
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
          topCustomer,
        },
        meta: {
          totalDays: daysInMonth,
          workingDays,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
          details: {
            message: String(error),
          },
        },
      },
      { status: 500 },
    );
  }
}
