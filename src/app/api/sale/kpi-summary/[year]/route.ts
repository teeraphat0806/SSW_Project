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

    // คำนวณยอดขายและจำนวนบิลที่มี OrderPO สำเร็จ
    const billStats = await prisma.bill.aggregate({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
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
    });

    // คำนวณรายรับจาก Bill ที่มี OrderPO completed
    const revenueStats = await prisma.bill.aggregate({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
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

    // หาเดือนที่มี Bill (มีรายได้หรือยอดขาย)
    const billsWithMonths = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
        OrderPO: {
          is: {
            status: "completed",
          },
        },
      },
      select: {
        createdAt: true,
      },
    });

    // สร้าง Set ของเดือนที่มีข้อมูล (0-11)
    const monthsWithData = new Set<number>();
    billsWithMonths.forEach((bill) => {
      const month = bill.createdAt.getMonth();
      monthsWithData.add(month);
    });

    // คำนวณค่าเงินเดือนพนักงานเฉพาะเดือนที่มีข้อมูล
    // ดึงพนักงานทั้งหมดที่มีอยู่
    const allStaff = await prisma.staff.findMany({
      select: { id: true },
    });

    let totalSalaryAmount = 0;

    // วนลูปคำนวณเงินเดือนเฉพาะเดือนที่มีข้อมูล
    for (const staff of allStaff) {
      for (const month of monthsWithData) {
        const monthDate = new Date(yearNumber, month, 1);

        // หาเงินเดือนที่มีผลในเดือนนั้น (effectiveDate ล่าสุดที่ <= วันแรกของเดือน)
        const salary = await prisma.staffSalary.findFirst({
          where: {
            staffId: staff.id,
            effectiveDate: {
              lte: monthDate,
            },
          },
          orderBy: {
            effectiveDate: "desc",
          },
        });

        if (salary) {
          totalSalaryAmount += salary.amount;
        }
      }
    }

    // หาลูกค้าที่มียอดซื้อมากที่สุด
    const customerPurchases = await prisma.bill.groupBy({
      by: ["customerId"],
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
        OrderPO: {
          is: {
            status: "completed",
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

    // ดึงข้อมูลลูกค้าที่มียอดซื้อมากที่สุด
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
        salary: {
          total: totalSalaryAmount,
          formatted: `฿${totalSalaryAmount.toLocaleString("en-US")}`,
        },
        topCustomer: topCustomer,
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
