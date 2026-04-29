import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
// API นี้ใช้ดึงหมวดหมู่รายจ่ายพร้อมสถิติประกอบของแต่ละหมวดหมู่
// UI: src/components/saledashboard2/ExpensesTable.tsx
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
    // ดึงหมวดหมู่รายจ่ายทั้งหมด
    const categories = await prisma.expenseCategory.findMany({
      include: {
        expenses: {
          select: {
            amount: true,
          },
        },
      },
    });

    // คำนวณสถิติของแต่ละหมวดหมู่
    const categoriesWithStats = categories.map((category) => {
      const expenseCount = category.expenses.length;
      const totalAmount = category.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        expenseCount,
        totalAmount,
      };
    });

    // คำนวณสถิติภาพรวม
    const totalCategories = categories.length;
    const totalExpenses = categoriesWithStats.reduce(
      (sum, cat) => sum + cat.expenseCount,
      0,
    );
    const totalAmount = categoriesWithStats.reduce(
      (sum, cat) => sum + cat.totalAmount,
      0,
    );

    const result = {
      success: true,
      data: categoriesWithStats,
      meta: {
        totalCategories,
        totalExpenses,
        totalAmount,
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
