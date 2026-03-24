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

    // Validate year and month
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

    const dailyData = [];
    let totalSalesAmt = 0;
    let totalSalesQty = 0;
    let totalBills = 0;

    // Loop through each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const startOfDay = new Date(yearNumber, monthNumber - 1, day);
      const endOfDay = new Date(yearNumber, monthNumber - 1, day + 1);

      // Get sales data for this day (from Bill)
      const salesStats = await prisma.bill.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
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
        _count: {
          id: true,
        },
      });

      const salesAmt = salesStats._sum.grandTotal || 0;
      const salesQty = salesStats._count.id || 0;

      // Only add days that have data
      if (salesAmt > 0 || salesQty > 0) {
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
