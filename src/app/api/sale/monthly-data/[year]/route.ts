import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { getSalaryForPeriod } from "@/lib/salary-expense-utils";
// API นี้ใช้สรุปข้อมูลรายเดือนทั้งปี (12 เดือน) สำหรับแสดงแนวโน้มรายได้/รายจ่าย
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

  const { session } = authResult;
  console.log(session);

  try {
    const yearNumber = Number(year);
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_YEAR",
            message: "ปีไม่ถูกต้อง กรุณาระบุปีระหว่าง 2000-2100",
            details: { field: "year", provided: year, expected: "2000-2100" },
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

    const startOfYear = new Date(yearNumber, 0, 1);
    const endOfYearExclusive = new Date(yearNumber + 1, 0, 1);
    const endOfYear = new Date(endOfYearExclusive.getTime() - 1);

    const [allStaff, employmentsFromDB, salariesFromDB] = await Promise.all([
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

    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(yearNumber, month - 1, 1);
      const endOfMonthExclusive = new Date(yearNumber, month, 1);
      const endOfMonth = new Date(endOfMonthExclusive.getTime() - 1);

      const [invoices, expenseStats] = await Promise.all([
        prisma.invoice.findMany({
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
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
              gte: startOfMonth,
              lt: endOfMonthExclusive,
            },
          },
          _sum: {
            amount: true,
          },
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

      let totalSalaries = 0;
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
        if (amount != null) {
          totalSalaries += amount;
        }
      }

      const salesAmt = totalAmount;
      const subtotal = totalAmount;
      const vat = taxAmount;
      const salesQty = totalBills;
      const income = totalAmount;
      const expenseAmount = expenseStats._sum.amount || 0;
      const expense = expenseAmount + totalSalaries;
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
        netAmount,
        formatted: {
          salesAmt: `฿${salesAmt.toLocaleString("en-US")}`,
          subtotal: `฿${subtotal.toLocaleString("en-US")}`,
          vat: `฿${vat.toLocaleString("en-US")}`,
          salesQty: `${salesQty}`,
          income: `฿${income.toLocaleString("en-US")}`,
          expense: `฿${expense.toLocaleString("en-US")}`,
          net: `฿${net.toLocaleString("en-US")}`,
          netAmount: `฿${netAmount.toLocaleString("en-US")}`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: monthlyData,
        meta: {
          year: yearNumber,
          totalMonths: 12,
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
