import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseSchema } from "@/lib/schemas/expense.schema";
export async function GET() {
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
    const expenses = await prisma.expense.findMany();
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
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
      receiptUrl,
    };
    if (ExpenseSchema.safeParse(objectData).success === false) {
      return NextResponse.json(
        { error: "Invalid expense data" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
