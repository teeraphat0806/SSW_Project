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

    // Validate required parameters
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

    const startOfMonth = new Date(yearNumber, monthNumber - 1, 1);
    const endOfMonth = new Date(yearNumber, monthNumber, 1);

    // Get all bills for the specified month
    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        grandTotal: {
          not: null,
          gt: 0, // Greater than 0
        },
      },
      include: {
        Customer: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the data
    const formattedBills = bills.map((bill) => ({
      id: bill.id,
      createdAt: bill.createdAt?.toISOString() || null,
      invoiceNo: bill.invoiceNo || "",
      customerName: bill.Customer?.name || "ไม่ระบุ",
      customerCode: bill.Customer?.code || "",
      grandTotal: bill.grandTotal || 0,
      formatted: {
        createdAt: bill.createdAt
          ? bill.createdAt.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "-",
        grandTotal: `฿${(bill.grandTotal || 0).toLocaleString("en-US")}`,
      },
    }));

    // Calculate summary
    const totalBills = formattedBills.length;
    const totalAmount = formattedBills.reduce(
      (sum, bill) => sum + bill.grandTotal,
      0,
    );

    const result = {
      success: true,
      data: formattedBills,
      meta: {
        year: yearNumber,
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        totalBills,
        totalAmount,
        formatted: {
          totalAmount: `฿${totalAmount.toLocaleString("en-US")}`,
        },
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
