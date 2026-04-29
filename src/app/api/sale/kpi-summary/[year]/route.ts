import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { getSalaryForPeriod } from "@/lib/salary-expense-utils";
// API นี้ใช้สรุป KPI รายปี เช่น ยอดขาย รายจ่าย กำไร และข้อมูลลูกค้าหลัก
// UI: src/app/saledashboard2/page.tsx
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
      invoices,
      expenseStats,
      allStaff,
      employmentsFromDB,
      salariesFromDB,
    ] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          id: true,
          createdAt: true,
          codetoinvoice: true,
          invoiceNo: true,
        },
        orderBy: {
          invoiceNo: "asc",
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

    const orderPOs = await prisma.orderPO.findMany({
      where: {
        codetoinvoice: {
          in: invoices.map((i) => i.codetoinvoice),
        },
      },
      include: {
        bill: {
          select: {
            grandTotal: true,
          },
        },
        Customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    const poMap = new Map(orderPOs.map((po) => [po.codetoinvoice, po]));

    const formattedBills = invoices.map((invoice) => {
      const po = poMap.get(invoice.codetoinvoice);
      return {
        id: invoice.id,
        createdAt: invoice.createdAt?.toISOString() || null,
        invoiceNo: invoice.invoiceNo || null,
        customerName: po?.Customer?.name || "ไม่ระบุ",
        customerAddress: po?.Customer?.address || "",
        grandTotal: po?.bill?.grandTotal || 0,
      };
    });

    const totalBills = formattedBills.length;
    const totalAmount = formattedBills.reduce(
      (sum, bill) => sum + bill.grandTotal,
      0,
    );
    const taxRate = 0.07;
    const taxAmount = totalAmount * taxRate;
    const netAmount = totalAmount + taxAmount;

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

    const totalSales = totalAmount;
    const orderCount = totalBills;
    const totalRevenueGross = totalAmount;
    const totalRevenueTax = taxAmount;
    const totalRevenue = totalAmount + taxAmount;
    const totalWithAndWithoutInvoiceGross = totalAmount;
    const totalWithAndWithoutInvoiceTax = taxAmount;
    const totalWithAndWithoutInvoiceNet = totalAmount + taxAmount;
    const totalExpenseAmount = expenseStats._sum.amount || 0;
    const totalExpense = totalExpenseAmount + totalSalaryAmount;
    const profit = totalSales - totalExpense;
    const profitWithAndWithoutInvoice =
      totalWithAndWithoutInvoiceGross - totalExpense;
    const profitPercentage =
      totalSales > 0 ? parseFloat(((profit / totalSales) * 100).toFixed(1)) : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          salesAmount: {
            total: totalSales,
            formatted: `฿${totalSales.toLocaleString("en-US")}`,
            totalWithAndWithoutInvoice: totalWithAndWithoutInvoiceGross,
            totalWithAndWithoutInvoiceFormatted: `฿${totalWithAndWithoutInvoiceGross.toLocaleString("en-US")}`,
          },
          salesQuantity: {
            total: orderCount,
            formatted: orderCount.toLocaleString("en-US"),
          },
          income: {
            total: totalRevenue,
            formatted: `฿${totalRevenue.toLocaleString("en-US")}`,
            totalWithAndWithoutInvoice: totalWithAndWithoutInvoiceGross,
            totalWithAndWithoutInvoiceFormatted: `฿${totalWithAndWithoutInvoiceGross.toLocaleString("en-US")}`,
            totalWithAndWithoutInvoiceAfterTax: totalWithAndWithoutInvoiceNet,
            totalWithAndWithoutInvoiceAfterTaxFormatted: `฿${totalWithAndWithoutInvoiceNet.toLocaleString("en-US")}`,
          },
          expense: {
            total: totalExpense,
            formatted: `฿${totalExpense.toLocaleString("en-US")}`,
            totalTax: totalWithAndWithoutInvoiceTax,
            totalTaxFormatted: `฿${totalWithAndWithoutInvoiceTax.toLocaleString("en-US")}`,
          },
          netProfit: {
            total: profit,
            formatted: `฿${profit.toLocaleString("en-US")}`,
            totalWithAndWithoutInvoice: profitWithAndWithoutInvoice,
            totalWithAndWithoutInvoiceFormatted: `฿${profitWithAndWithoutInvoice.toLocaleString("en-US")}`,
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
