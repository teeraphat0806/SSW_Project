import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseSchema } from "@/lib/schemas/expense.schema";

export async function GET(request: NextRequest) {
  try {
    const authRequest = await requireAuth([
      "superadmin",
      "clerk",
      "supervisor",
      "cutter",
      "delivery",
    ]);
    if ("response" in authRequest) {
      return authRequest.response;
    }

    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const startDate = searchParams.get("startDate"); // Format: YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // Format: YYYY-MM-DD
    const categoryId = searchParams.get("categoryId");
    const sortBy = searchParams.get("sortBy") || "date_desc"; // date_desc, date_asc, amount_desc, amount_asc

    // Build where clause
    const where: any = {};

    // Filter by date range
    if (startDate || endDate) {
      where.expenseDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.expenseDate.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case "date_asc":
        orderBy = { expenseDate: "asc" };
        break;
      case "date_desc":
        orderBy = { expenseDate: "desc" };
        break;
      case "amount_asc":
        orderBy = { amount: "asc" };
        break;
      case "amount_desc":
        orderBy = { amount: "desc" };
        break;
      default:
        orderBy = { expenseDate: "desc" };
    }

    // Fetch expenses with pagination and filters
    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json(
      {
        expenses,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authRequest = await requireAuth([
    "superadmin",
    "clerk",
    "supervisor",
    "delivery",
  ]);
  if ("response" in authRequest) {
    return authRequest.response;
  }
  try {
    const { amount, description, expenseDate, categoryId, receiptUrl } =
      await request.json();
    const objectData = {
      amount,
      description,
      expenseDate,
      categoryId,
      receiptUrl: receiptUrl || "",
    };
    if (ExpenseSchema.safeParse(objectData).success === false) {
      return NextResponse.json(
        { error: "Invalid expense data" },
        { status: 400 },
      );
    }
    const newExpense = await prisma.expense.create({
      data: {
        amount: amount || 0,
        description: description || "",
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        categoryId: categoryId || 1,
        receiptUrl: receiptUrl || "",
      },
    });
    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authRequest = await requireAuth([
    "superadmin",
    "clerk",
    "supervisor",
    "delivery",
  ]);
  if ("response" in authRequest) {
    return authRequest.response;
  }
  try {
    const { expenseIds } = await request.json();
    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return NextResponse.json(
        { error: "No expense IDs provided for deletion" },
        { status: 400 },
      );
    }
    const deleteResult = await prisma.expense.deleteMany({
      where: {
        id: { in: expenseIds },
      },
    });
    return NextResponse.json(
      { message: `Deleted ${deleteResult.count} expenses` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting expenses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
