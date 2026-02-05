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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const customerId = searchParams.get("customerId");
    const customerName = searchParams.get("customerName");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    // Validate sortBy
    const validSortBy = ["date", "amount", "quantity", "customer"];
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_BY",
            message: "sortBy ไม่ถูกต้อง",
            details: {
              field: "sortBy",
              provided: sortBy,
              expected: validSortBy.join(", "),
            },
          },
        },
        { status: 400 },
      );
    }

    // Validate sortOrder
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_ORDER",
            message: "sortOrder ไม่ถูกต้อง",
            details: {
              field: "sortOrder",
              provided: sortOrder,
              expected: "asc, desc",
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

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
      OrderPO: {
        is: {
          status: "completed",
        },
      },
    };

    // Add customer filters
    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    if (customerName) {
      whereClause.Customer = {
        name: {
          contains: customerName,
          mode: "insensitive",
        },
      };
    }

    // Build orderBy clause
    let orderByClause: any = {};
    if (sortBy === "date") {
      orderByClause = { createdAt: sortOrder };
    } else if (sortBy === "amount") {
      orderByClause = { grandTotal: sortOrder };
    } else if (sortBy === "customer") {
      orderByClause = { Customer: { name: sortOrder } };
    } else if (sortBy === "quantity") {
      // For quantity, we'll need to handle this differently as it's count of products
      orderByClause = { createdAt: sortOrder }; // fallback to date for now
    }

    // Get total count
    const total = await prisma.bill.count({
      where: whereClause,
    });

    // Get bill count per customer
    const billsByCustomer = await prisma.bill.groupBy({
      by: ["customerId"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Create a map of customer ID to bill count
    const customerBillCount = new Map<number, number>();
    billsByCustomer.forEach((item) => {
      customerBillCount.set(item.customerId, item._count.id);
    });

    // Get paginated data
    const skip = (page - 1) * limit;
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        Customer: true,
        OrderPO: {
          include: {
            Product: true,
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Calculate totals for meta
    const allBills = await prisma.bill.aggregate({
      where: whereClause,
      _sum: {
        grandTotal: true,
      },
      _count: {
        id: true,
      },
    });

    // Format data
    const formattedData = bills.map((bill) => {
      const date = bill.createdAt;
      const quantity = customerBillCount.get(bill.customerId) || 1; // Number of bills for this customer

      return {
        id: bill.id,
        date: date.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        dateISO: date.toISOString().split("T")[0],
        customer: bill.Customer
          ? {
              id: bill.Customer.id,
              name: bill.Customer.name,
            }
          : null,
        amount: bill.grandTotal || 0,
        quantity,
        billId: bill.id,
        invoiceNo: bill.invoiceNo ? `INV-${bill.invoiceNo}` : null,
        formatted: {
          date: date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          amount: `฿${(bill.grandTotal || 0).toLocaleString("en-US")}`,
          quantity: `${quantity}`,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    const result = {
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta: {
        year: yearNumber,
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        totalAmount: allBills._sum.grandTotal || 0,
        totalQuantity: allBills._count.id || 0,
        currency: "THB",
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
