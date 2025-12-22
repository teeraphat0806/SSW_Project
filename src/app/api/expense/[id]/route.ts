import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseSchema } from "@/lib/schemas/expense.schema";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) {
    return authResult.response;
  }
  const { id } = await context.params;
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) {
    return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
  }
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRequest = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authRequest) {
    return authRequest.response;
  }

  const { id } = await context.params;
  const expenseId = Number(id);
  if (Number.isNaN(expenseId)) {
    return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = ExpenseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid expense data" },
      { status: 400 }
    );
  }
  try {
    const updatedExpense = await prisma.expense.update({
      where: { id: Number(expenseId) },
      data: parsed.data,
    });

    return NextResponse.json({ expense: updatedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authRequest = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authRequest) {
    return authRequest.response;
  }
  try {
    const { id } = await context.params;
    const expenseId = Number(id);
    if (Number.isNaN(expenseId)) {
      return NextResponse.json(
        { error: "Invalid expense id" },
        { status: 400 }
      );
    }
    const deletedExpense = await prisma.expense.delete({
      where: { id: expenseId },
    });
    return NextResponse.json({ expense: deletedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
