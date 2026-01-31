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

    // Get staff salaries for the month
    // First, get all staff
    const allStaff = await prisma.staff.findMany({
      include: {
        user: true,
      },
    });

    // Get staff salaries for the month
    const salariesFromDB = await prisma.staffSalary.findMany({
      where: {
        effectiveDate: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      include: {
        Staff: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        effectiveDate: "desc", // Get latest first
      },
    });

    // Group by staffId and take only the latest one per staff
    const staffSalaryMap = new Map<number, (typeof salariesFromDB)[0]>();
    salariesFromDB.forEach((salary) => {
      if (!staffSalaryMap.has(salary.staffId)) {
        staffSalaryMap.set(salary.staffId, salary);
      }
    });

    // Build salary expenses - one per staff
    const salaryExpenses = allStaff.map((staff, index) => {
      const salaryRecord = staffSalaryMap.get(staff.id);
      const amount = salaryRecord ? salaryRecord.amount : staff.currentSalary;
      const effectiveDate = salaryRecord
        ? salaryRecord.effectiveDate
        : new Date(yearNumber, monthNumber - 1, 1); // First day of month if using currentSalary

      return {
        id: -1000000 - index, // Negative ID to distinguish from real expenses
        expenseDate: effectiveDate,
        categoryId: null,
        category: null,
        description: `เงินเดือนพนักงาน - ${staff.user?.name || "Unknown"}${salaryRecord ? "" : " (ใช้เงินเดือนปัจจุบัน)"}`,
        amount: amount,
        receiptUrl: null,
        staffName: staff.user?.name || "Unknown",
      };
    });

    // Get total count (expenses + salaries)
    const expenseCount = await prisma.expense.count({
      where: whereClause,
    });
    const total = expenseCount + allStaff.length; // Use allStaff.length instead of salaries.length

    // Combine expenses and salaries, then sort
    let allExpenses: any[] = [];

    // Get all expenses without pagination first
    const expensesData = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: {
          include: {
            Staff: true,
          },
        },
      },
    });

    // Combine with salary expenses
    allExpenses = [
      ...expensesData.map((e) => ({
        ...e,
        staffName: undefined, // Expenses don't have direct staff relation
      })),
      ...salaryExpenses,
    ];

    // Sort combined data
    if (sortBy === "date") {
      allExpenses.sort((a, b) => {
        const dateA = a.expenseDate.getTime();
        const dateB = b.expenseDate.getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === "amount") {
      allExpenses.sort((a, b) => {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      });
    } else if (sortBy === "category") {
      allExpenses.sort((a, b) => {
        const catA = a.category?.name || "เงินเดือน";
        const catB = b.category?.name || "เงินเดือน";
        return sortOrder === "asc"
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      });
    }

    // Apply pagination after sorting
    const skip = (page - 1) * limit;
    const expenses = allExpenses.slice(skip, skip + limit);

    // Calculate totals including salaries
    const allExpensesForTotal = await prisma.expense.findMany({
      where: whereClause,
    });

    const expensesTotal = allExpensesForTotal.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const salariesTotal = salaryExpenses.reduce(
      (sum, sal) => sum + sal.amount,
      0,
    );
    const totalAmount = expensesTotal + salariesTotal;

    // Build category breakdown (including salary as a category)
    const allExpensesGrouped = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const categoryBreakdown = await Promise.all(
      allExpensesGrouped.map(async (expense) => {
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

    // Add salary as a category
    if (salariesTotal > 0) {
      categoryBreakdown.push({
        category: "เงินเดือนพนักงาน",
        amount: salariesTotal,
        percentage:
          totalAmount > 0
            ? parseFloat(((salariesTotal / totalAmount) * 100).toFixed(1))
            : 0,
      });
    }

    // Format data
    const formattedData = expenses.map((expense) => {
      // Check if this is a salary expense (negative ID)
      const isSalary = expense.id < 0;

      return {
        id: expense.id,
        date: expense.expenseDate.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        dateISO: expense.expenseDate.toISOString().split("T")[0],
        category: isSalary
          ? {
              id: -1,
              name: "เงินเดือนพนักงาน",
              description: "เงินเดือนประจำเดือน",
            }
          : expense.category
            ? {
                id: expense.category.id,
                name: expense.category.name,
                description: expense.category.description,
              }
            : null,
        description: expense.description,
        amount: expense.amount,
        receiptUrl: expense.receiptUrl,
        staff: isSalary
          ? {
              id: 0,
              name: expense.staffName || "พนักงาน",
            }
          : expense.category?.Staff
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
