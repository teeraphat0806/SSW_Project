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
      status: "completed",
      OR: [
        {
          completedAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        {
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      ],
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
      orderByClause = { completedAt: sortOrder };
    } else if (sortBy === "amount") {
      orderByClause = { total: sortOrder };
    } else if (sortBy === "customer") {
      orderByClause = { Customer: { name: sortOrder } };
    } else if (sortBy === "quantity") {
      // For quantity, we'll need to handle this differently as it's count of products
      orderByClause = { createdAt: sortOrder }; // fallback to date for now
    }

    // Get total count
    const total = await prisma.orderPO.count({
      where: whereClause,
    });

    // Get paginated data
    const skip = (page - 1) * limit;
    const orders = await prisma.orderPO.findMany({
      where: whereClause,
      include: {
        Customer: true,
        bill: true,
        Product: true,
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Calculate totals for meta
    const allOrders = await prisma.orderPO.aggregate({
      where: whereClause,
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Format data
    const formattedData = orders.map((order) => {
      const date = order.completedAt || order.createdAt;
      const quantity = order.Product.length;

      return {
        id: order.id,
        date: date.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        dateISO: date.toISOString().split("T")[0],
        customer: order.Customer
          ? {
              id: order.Customer.id,
              code: order.Customer.code,
              name: order.Customer.name,
            }
          : null,
        amount: order.total,
        quantity,
        billId: order.billId,
        invoiceNo: order.bill?.invoiceNo ? `INV-${order.bill.invoiceNo}` : null,
        formatted: {
          date: date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          amount: `฿${order.total.toLocaleString("en-US")}`,
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
        totalAmount: allOrders._sum.total || 0,
        totalQuantity: allOrders._count.id || 0,
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
