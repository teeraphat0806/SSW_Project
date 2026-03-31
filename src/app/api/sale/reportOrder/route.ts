import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
function isNumericString(value: string): boolean {
  return /^[0-9]+$/.test(value);
}
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

  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    console.log("searchParams:", Object.fromEntries(searchParams.entries()));
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const customerId = searchParams.get("customerId") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameter
    if (isNumericString(customerId) === false && customerId !== "") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CUSTOMER_ID",
            message: "รหัสลูกค้าไม่ถูกต้อง ต้องเป็นตัวเลขเท่านั้น",
            details: {
              field: "customerId",
              provided: customerId,
              expected: "Numeric string",
            },
          },
        },
        { status: 400 },
      );
    }
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

    // Determine date range
    let startOfPeriod: Date;
    let endOfPeriod: Date;

    // Get today for validation
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (startDate && endDate) {
      // Custom date range mode
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      // Validate dates
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_FORMAT",
              message: "รูปแบบวันที่ไม่ถูกต้อง",
              details: {
                provided: { startDate, endDate },
                expected: "YYYY-MM-DD",
              },
            },
          },
          { status: 400 },
        );
      }

      // Check if dates are not in the future
      if (parsedStartDate > today || parsedEndDate > today) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FUTURE_DATE_NOT_ALLOWED",
              message: "วันที่ต้องไม่เกินวันนี้",
              details: {
                today: today.toISOString().split("T")[0],
                provided: { startDate, endDate },
              },
            },
          },
          { status: 400 },
        );
      }

      // Check if start date is before or equal to end date
      if (parsedStartDate > parsedEndDate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_RANGE",
              message: "วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด",
              details: {
                startDate,
                endDate,
              },
            },
          },
          { status: 400 },
        );
      }

      startOfPeriod = parsedStartDate;
      startOfPeriod.setHours(0, 0, 0, 0);

      endOfPeriod = parsedEndDate;
      endOfPeriod.setHours(23, 59, 59, 999);
    } else {
      // Default to month range
      startOfPeriod = new Date(yearNumber, monthNumber - 1, 1);
      endOfPeriod = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);
    }

    // Get all bills for the specified period
    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startOfPeriod,
          lte: endOfPeriod,
        },
        grandTotal: {
          not: null,
          gt: 0, // Greater than 0
        },
        customerId: Number(customerId) || undefined,
        OrderPO: {
          is: {
            status: "completed",
          },
        },
      },
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        OrderPO: {
          select: {
            codetoinvoice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const invoice = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfPeriod,
          lte: endOfPeriod,
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
    });


    const orderPO = await prisma.orderPO.findMany({
      where: {codetoinvoice: {in: invoice.map((i) => i.codetoinvoice)}},
      include: {
        bill: {
          select: {
            grandTotal: true,
          }
        },
         Customer: {
          select: {
            id: true,
            name: true,
            address: true,
          }
         }
      }
    })

   
    // Get unique codetoinvoice values and fetch all invoices
    const codetoinvoices = bills
      .map((b) => b.OrderPO?.codetoinvoice)
      .filter((c) => c !== null && c !== undefined)
      .map((c) =>
        typeof c === "string" ? parseInt(c as string, 10) : (c as number),
      );

    const invoiceMap = new Map<number | string, number>();
    if (codetoinvoices.length > 0) {
      const invoices = await prisma.invoice.findMany({
        where: {
          codetoinvoice: {
            in: codetoinvoices as number[],
          },
        },
        select: {
          codetoinvoice: true,
          invoiceNo: true,
        },
      });

      invoices.forEach((inv) => {
        invoiceMap.set(inv.codetoinvoice, inv.invoiceNo);
      });
    }

    const poMap = new Map(orderPO.map((po) => [po.codetoinvoice, po]));


    // Format the data
    const formattedBills = invoice.map((invoice) => {
      const po  =  poMap.get(invoice.codetoinvoice);
      return {
        id: invoice.id,
        createdAt: invoice.createdAt?.toISOString() || null,
        invoiceNo: invoice.invoiceNo || null,
        customerName: po?.Customer?.name || "ไม่ระบุ",
        customerAddress: po?.Customer?.address || "",
        grandTotal: po?.bill?.grandTotal || 0,
        formatted: {
          createdAt: invoice.createdAt
            ? invoice.createdAt.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "-",
          grandTotal: `฿${(po?.bill?.grandTotal || 0).toLocaleString("en-US")}`,
        },
      };
    });

    console.log("Formatted Bills:", formattedBills);

    // Sort by invoiceNo ASC; null/undefined invoiceNo goes last
    formattedBills.sort((a, b) => {
      if (a.invoiceNo == null && b.invoiceNo == null) return 0;
      if (a.invoiceNo == null) return 1;
      if (b.invoiceNo == null) return -1;
      if (a.invoiceNo !== b.invoiceNo) return a.invoiceNo - b.invoiceNo;
      return String(a.id).localeCompare(String(b.id));
    });

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
        dateRange:
          startDate && endDate
            ? {
                startDate,
                endDate,
                formatted: {
                  startDate: new Date(startDate).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                  endDate: new Date(endDate).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
              }
            : null,
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
