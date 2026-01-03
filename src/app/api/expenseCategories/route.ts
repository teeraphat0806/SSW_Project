import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ExpenseCategorySchema } from "@/lib/schemas/expenseCategory.schema";
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
    const expenseCategories = await prisma.expenseCategory.findMany();
    return NextResponse.json({ expenseCategories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
