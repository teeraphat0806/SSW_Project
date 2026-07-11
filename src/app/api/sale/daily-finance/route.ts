import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
// API นี้ใช้สรุปรายรับ รายจ่าย และกำไร/ขาดทุนรายวันในเดือนที่เลือก
// UI: ยังไม่พบการเรียกใช้งานในฝั่งหน้าเว็บ (สำรองไว้สำหรับรายงานรายวัน)
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
    // ดึงพารามิเตอร์จาก query string
    const searchParams = req.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // ตรวจสอบพารามิเตอร์
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

    // ตรวจสอบปี
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

    // ตรวจสอบเดือน
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
    const startOfMonth = new Date(yearNumber, monthNumber - 1, 1);
    const endOfMonth = new Date(yearNumber, monthNumber, 1);

    // ดึงรายรับ (Bill) และรายจ่าย (Expense) ทั้งหมดของเดือนนี้ใน 2 คิวรีขนานกัน
    const [bills, expenses] = await Promise.all([
      prisma.bill.findMany({
        where: {
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
          OrderPO: {
            is: {
              status: { not: "canceled" },
              Invoice: { isNot: null },
            },
          },
        },
        select: {
          createdAt: true,
          grandTotal: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        select: {
          expenseDate: true,
          amount: true,
        },
      }),
    ]);

    // จัดกลุ่มรายรับและรายจ่ายรายวันในหน่วยความจำ (Memory Map)
    const financialByDay = new Map<number, { income: number; expense: number }>();

    for (const bill of bills) {
      const dayOfMonth = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          day: "numeric",
        }).format(bill.createdAt)
      );

      const current = financialByDay.get(dayOfMonth) || { income: 0, expense: 0 };
      current.income += bill.grandTotal || 0;
      financialByDay.set(dayOfMonth, current);
    }

    for (const exp of expenses) {
      const dayOfMonth = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          day: "numeric",
        }).format(exp.expenseDate)
      );

      const current = financialByDay.get(dayOfMonth) || { income: 0, expense: 0 };
      current.expense += exp.amount || 0;
      financialByDay.set(dayOfMonth, current);
    }

    const dailyData = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const stats = financialByDay.get(day);

      if (stats && (stats.income > 0 || stats.expense > 0)) {
        const startOfDay = new Date(yearNumber, monthNumber - 1, day);
        const income = stats.income;
        const expense = stats.expense;
        const net = income - expense;

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
    // ผลลัพสรุปการเงินรายวัน พร้อมข้อมูลเมตา เช่น ปี เดือน และวันที่อัปเดตล่าสุด
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
