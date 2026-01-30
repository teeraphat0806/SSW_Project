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
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category");
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
    const validSortBy = ["date", "amount", "category"];
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
      expenseDate: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    };

    // Add category filters
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId);
    }

    if (category) {
      whereClause.category = {
        name: {
          contains: category,
          mode: "insensitive",
        },
      };
    }

    // Build orderBy clause
    let orderByClause: any = {};
    if (sortBy === "date") {
      orderByClause = { expenseDate: sortOrder };
    } else if (sortBy === "amount") {
      orderByClause = { amount: sortOrder };
    } else if (sortBy === "category") {
      orderByClause = { category: { name: sortOrder } };
    }

    // Get total count
    const total = await prisma.expense.count({
      where: whereClause,
    });

    // Get paginated data
    const skip = (page - 1) * limit;
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            Staff: true,
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // Calculate totals and category breakdown for meta
    const allExpenses = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get total amount
    const totalAmountResult = await prisma.expense.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    const totalAmount = totalAmountResult._sum.amount || 0;

    // Build category breakdown
    const categoryBreakdown = await Promise.all(
      allExpenses.map(async (expense) => {
        const cat = await prisma.expenseCategory.findUnique({
          where: { id: expense.categoryId },
        });
        const amount = expense._sum.amount || 0;
        const percentage =
          totalAmount > 0
            ? parseFloat(((amount / totalAmount) * 100).toFixed(1))
            : 0;

        return {
          category: cat?.name || "Unknown",
          amount,
          percentage,
        };
      }),
    );

    // Format data
    const formattedData = expenses.map((expense) => {
      return {
        id: expense.id,
        date: expense.expenseDate.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        dateISO: expense.expenseDate.toISOString().split("T")[0],
        category: expense.category
          ? {
              id: expense.category.id,
              name: expense.category.name,
              description: expense.category.description,
            }
          : null,
        description: expense.description,
        amount: expense.amount,
        receiptUrl: expense.receiptUrl,
        staff: expense.category?.Staff
          ? {
              id: expense.category.Staff.id,
              name: expense.category.Staff.user?.name || "Unknown",
            }
          : null,
        formatted: {
          date: expense.expenseDate.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          amount: `฿${expense.amount.toLocaleString("en-US")}`,
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
        totalAmount,
        categoryBreakdown: categoryBreakdown.sort(
          (a, b) => b.amount - a.amount,
        ),
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
