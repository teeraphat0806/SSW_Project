import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { getSalaryForPeriod } from "@/lib/salary-expense-utils";

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
    const startOfYear = new Date(yearNumber, 0, 1);
    const endOfYearExclusive = new Date(yearNumber + 1, 0, 1);
    const endOfYear = new Date(endOfYearExclusive.getTime() - 1);

    const [
      billStats,
      revenueStats,
      expenseStats,
      allStaff,
      employmentsFromDB,
      salariesFromDB,
    ] = await Promise.all([
      prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYearExclusive,
          },
          OrderPO: {
            is: {
              status: "completed",
            },
          },
        },
        _sum: {
          grandTotal: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYearExclusive,
          },
          OrderPO: {
            is: {
              status: { not: "canceled" },
              Invoice: { isNot: null },
            },
          },
        },
        _sum: {
          grandTotal: true,
        },
      }),
      prisma.expense.aggregate({
        where: {
          expenseDate: {
            gte: startOfYear,
            lt: endOfYearExclusive,
          },
        },
        _sum: {
          amount: true,
        },
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
          startDate: { lte: endOfYear },
          OR: [{ endDate: null }, { endDate: { gte: startOfYear } }],
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
          effectiveDate: { lte: endOfYear },
        },
        select: {
          staffId: true,
          amount: true,
          effectiveDate: true,
        },
        orderBy: [{ staffId: "asc" }, { effectiveDate: "desc" }],
      }),
    ]);

    const currentDate = new Date();
    const isCurrentYear = yearNumber === currentDate.getFullYear();
    const lastMonthIndex = isCurrentYear ? currentDate.getMonth() : 11;
    const monthsInYear = Array.from(
      { length: lastMonthIndex + 1 },
      (_, month) => month,
    );

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

    let totalSalaryAmount = 0;

    for (const month of monthsInYear) {
      const periodStart = new Date(yearNumber, month, 1);
      const periodEndExclusive = new Date(yearNumber, month + 1, 1);
      const periodEnd = new Date(periodEndExclusive.getTime() - 1);

      for (const staff of allStaff) {
        const amount = getSalaryForPeriod(
          {
            staff,
            employments: employmentMap.get(staff.id) ?? [],
            salaries: staffSalaryMap.get(staff.id) ?? [],
          },
          periodStart,
          periodEnd,
        );
        if (amount != null) {
          totalSalaryAmount += amount;
        }
      }
    }

    const customerPurchases = await prisma.bill.groupBy({
      by: ["customerId"],
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYearExclusive,
        },
        OrderPO: {
          is: {
            status: { not: "canceled" },
            Invoice: { isNot: null },
          },
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        grandTotal: true,
      },
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

    const totalSales = billStats._sum.grandTotal || 0;
    const orderCount = billStats._count.id || 0;
    const totalRevenue = revenueStats._sum.grandTotal || 0;
    const totalExpenseAmount = expenseStats._sum.amount || 0;
    const totalExpense = totalExpenseAmount + totalSalaryAmount;
    const profit = totalRevenue - totalExpense;
    const profitPercentage =
      totalRevenue > 0
        ? parseFloat(((profit / totalRevenue) * 100).toFixed(1))
        : 0;

    return NextResponse.json(
      {
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
          salary: {
            total: totalSalaryAmount,
            formatted: `฿${totalSalaryAmount.toLocaleString("en-US")}`,
          },
          topCustomer,
        },
        meta: {
          year: yearNumber,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPI summary: " + error },
      { status: 500 },
    );
  }
}
