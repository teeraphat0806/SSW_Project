import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  getLatestSalaryAtOrBefore,
  getSalaryForPeriod,
} from "@/lib/salary-expense-utils";

function getMonthNames() {
  return [
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

  const { session } = authResult;
  console.log(session);

  try {
    const searchParams = req.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "กรุณาระบุปีและเดือน",
            details: { required: ["year", "month"] },
          },
        },
        { status: 400 },
      );
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);
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

    const validSortBy = ["date", "amount", "category"];
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_BY",
            message: "sortBy ไม่ถูกต้อง กรุณาระบุค่าที่ถูกต้อง",
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
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_ORDER",
            message: "sortOrder ไม่ถูกต้อง กรุณาระบุค่า asc หรือ desc",
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

    let startOfPeriod: Date;
    let endOfPeriod: Date;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_FORMAT",
              message:
                "รูปแบบวันที่ไม่ถูกต้อง กรุณาระบุวันที่ในรูปแบบ YYYY-MM-DD",
              details: {
                provided: { startDate, endDate },
                expected: "YYYY-MM-DD",
              },
            },
          },
          { status: 400 },
        );
      }

      if (parsedStartDate > today || parsedEndDate > today) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FUTURE_DATE_NOT_ALLOWED",
              message: "วันที่ไม่ถูกต้อง กรุณาระบุวันที่ในอดีต",
              details: {
                today: today.toISOString().split("T")[0],
                provided: { startDate, endDate },
              },
            },
          },
          { status: 400 },
        );
      }

      if (parsedStartDate > parsedEndDate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_RANGE",
              message:
                "ช่วงวันที่ไม่ถูกต้อง กรุณาระบุวันที่เริ่มต้นก่อนวันที่สิ้นสุด",
              details: { startDate, endDate },
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
      startOfPeriod = new Date(yearNumber, monthNumber - 1, 1);
      endOfPeriod = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);
    }

    const whereClause: any = {
      expenseDate: {
        gte: startOfPeriod,
        lte: endOfPeriod,
      },
    };
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId, 10);
    }
    if (category) {
      whereClause.category = {
        name: { contains: category, mode: "insensitive" },
      };
    }

    const [allStaff, employmentsFromDB, salariesFromDB] = await Promise.all([
      prisma.staff.findMany({
        select: {
          id: true,
          currentSalary: true,
          startDate: true,
          hireStatus: true,
          TerminationDate: true,
          user: { select: { name: true } },
        },
      }),
      prisma.staffEmployment.findMany({
        where: {
          startDate: { lte: endOfPeriod },
          OR: [{ endDate: null }, { endDate: { gte: startOfPeriod } }],
        },
        select: {
          staffId: true,
          startDate: true,
          endDate: true,
        },
        orderBy: [{ staffId: "asc" }, { startDate: "desc" }],
      }),
      prisma.staffSalary.findMany({
        where: { effectiveDate: { lte: endOfPeriod } },
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

    const salaryExpenses = allStaff.flatMap((staff, index) => {
      const employments = employmentMap.get(staff.id) ?? [];
      const salaries = staffSalaryMap.get(staff.id) ?? [];
      const amount = getSalaryForPeriod(
        { staff, employments, salaries },
        startOfPeriod,
        endOfPeriod,
      );
      if (amount == null) return [];

      const latestSalary = getLatestSalaryAtOrBefore(salaries, endOfPeriod);
      const effectiveDate = latestSalary
        ? latestSalary.effectiveDate
        : startOfPeriod;

      return [
        {
          id: -1000000 - index,
          expenseDate: effectiveDate,
          categoryId: null,
          category: null,
          description: `ค่าเงินเดือนพนักงาน - ${staff.user?.name || "ไม่ระบุชื่อพนักงาน"}${latestSalary ? "" : " (ไม่มีข้อมูลเงินเดือนในช่วงเวลาที่เลือก)"}`,
          amount,
          receiptUrl: null,
          staffName: staff.user?.name || "Unknown",
        },
      ];
    });

    const [expenseCount, expensesData, allExpensesGrouped] = await Promise.all([
      prisma.expense.count({ where: whereClause }),
      prisma.expense.findMany({
        where: whereClause,
        include: {
          category: true,
          staff: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const total = expenseCount + salaryExpenses.length;

    const allCombinedExpenses = [
      ...expensesData.map((expense: any) => ({
        ...expense,
        staff: expense.staff
          ? {
              id: expense.staff.id,
              name: expense.staff.user?.name || "ไม่ระบุชื่อพนักงาน",
            }
          : null,
      })),
      ...salaryExpenses,
    ] as any[];

    if (sortBy === "date") {
      allCombinedExpenses.sort((a, b) => {
        const dateA = a.expenseDate.getTime();
        const dateB = b.expenseDate.getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else if (sortBy === "amount") {
      allCombinedExpenses.sort((a, b) =>
        sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount,
      );
    } else {
      allCombinedExpenses.sort((a, b) => {
        const catA = a.category?.name || "เน€เธเธดเธเน€เธ”เธทเธญเธ";
        const catB = b.category?.name || "เน€เธเธดเธเน€เธ”เธทเธญเธ";
        return sortOrder === "asc"
          ? catA.localeCompare(catB)
          : catB.localeCompare(catA);
      });
    }

    const skip = (page - 1) * limit;
    const expenses = allCombinedExpenses.slice(skip, skip + limit);

    const expensesTotal = expensesData.reduce(
      (sum, exp) => sum + exp.amount,
      0,
    );
    const salariesTotal = salaryExpenses.reduce(
      (sum, sal) => sum + sal.amount,
      0,
    );
    const totalAmount = expensesTotal + salariesTotal;

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

    const formattedData = expenses.map((expense) => {
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
              description: "ค่าเงินเดือนของพนักงานที่ทำงานในบริษัท",
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
          ? { id: 0, name: expense.staffName || "ไม่ระบุชื่อพนักงาน" }
          : expense.staff || null,
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
    const monthNames = getMonthNames();

    return NextResponse.json(
      {
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
          totalAmount,
          categoryBreakdown: categoryBreakdown.sort(
            (a, b) => b.amount - a.amount,
          ),
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
          message: "เกิดข้อผิดพลาดภายในระบบ",
          details: {
            message: String(error),
          },
        },
      },
      { status: 500 },
    );
  }
}
