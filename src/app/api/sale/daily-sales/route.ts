import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
// API นี้ใช้สรุปยอดขายรายวัน (มูลค่าและจำนวนบิล) ในเดือนที่เลือก
// UI: src/components/saledashboard2/DailySalesChart.tsx บนหน้า src/app/saledashboard2/[year]/[month]/page.tsx
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

    // ตรวจสอบปีและเดือน
    if (
      isNaN(yearNumber) ||
      yearNumber < 2000 ||
      yearNumber > 2100 ||
      isNaN(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAMETERS",
            message: "ปีหรือเดือนไม่ถูกต้อง",
            details: {
              year: "2000-2100",
              month: "1-12",
              provided: { year: yearNumber, month: monthNumber },
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

    // ดึงบิลทั้งหมดของเดือนนี้ในการสืบค้นครั้งเดียว
    const bills = await prisma.bill.findMany({
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
    });

    // จัดกลุ่มข้อมูลยอดขายรายวันในหน่วยความจำ (Memory Map)
    const salesByDay = new Map<number, { salesAmt: number; salesQty: number }>();

    for (const bill of bills) {
      const dayOfMonth = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Bangkok",
          day: "numeric",
        }).format(bill.createdAt)
      );

      const current = salesByDay.get(dayOfMonth) || { salesAmt: 0, salesQty: 0 };
      current.salesAmt += bill.grandTotal || 0;
      current.salesQty += 1;
      salesByDay.set(dayOfMonth, current);
    }

    const dailyData = [];
    let totalSalesAmt = 0;
    let totalSalesQty = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const stats = salesByDay.get(day);

      if (stats && (stats.salesAmt > 0 || stats.salesQty > 0)) {
        const startOfDay = new Date(yearNumber, monthNumber - 1, day);
        const salesAmt = stats.salesAmt;
        const salesQty = stats.salesQty;

        dailyData.push({
          day,
          date: startOfDay.toISOString().split("T")[0],
          salesAmt,
          salesQty,
          formatted: {
            salesAmt: `฿${salesAmt.toLocaleString("en-US")}`,
            salesQty: `${salesQty}`,
          },
        });

        totalSalesAmt += salesAmt;
        totalSalesQty += salesQty;
      }
    }

    const result = {
      success: true,
      data: dailyData,
      meta: {
        year: yearNumber,
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        totalDays: daysInMonth,
        totalSalesAmt,
        totalSalesQty,
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
