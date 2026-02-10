import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseSchema } from "@/lib/schemas/expense.schema";
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
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
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
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
  console.log("📥 PATCH /api/expense/[id] - Received body:", body);

  const parsed = ExpenseSchema.partial().safeParse(body);
  if (!parsed.success) {
    console.log("❌ Validation failed:", parsed.error);
    return NextResponse.json(
      { error: "Invalid expense data" },
      { status: 400 },
    );
  }

  console.log("✅ Validation passed. Updating with data:", parsed.data);

  try {
    const updatedExpense = await prisma.expense.update({
      where: { id: Number(expenseId) },
      data: parsed.data,
    });

    console.log("✅ Expense updated successfully:", updatedExpense);
    return NextResponse.json({ expense: updatedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  console.log("🔵 DELETE /api/expense/[id] - Request received");

  const authRequest = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authRequest) {
    console.log("❌ DELETE - Authorization failed");
    return authRequest.response;
  }

  console.log("✅ DELETE - Authorization passed");

  try {
    const { id } = await context.params;
    const expenseId = Number(id);

    console.log(`🆔 DELETE - Expense ID: ${id} (parsed: ${expenseId})`);

    if (Number.isNaN(expenseId)) {
      console.log("❌ DELETE - Invalid expense ID");
      return NextResponse.json(
        { error: "Invalid expense id" },
        { status: 400 },
      );
    }

    console.log(`🗑️ DELETE - Attempting to delete expense ID: ${expenseId}`);

    const deletedExpense = await prisma.expense.delete({
      where: { id: expenseId },
    });

    console.log(`✅ DELETE - Successfully deleted expense:`, deletedExpense);

    return NextResponse.json(
      {
        message: "ลบค่าใช้จ่ายสำเร็จ",
        expense: deletedExpense,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("❌ DELETE - Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
