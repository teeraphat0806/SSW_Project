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
    const expenseCategories = await prisma.expenseCategory.findMany({
      include: {
        _count: {
          select: { expenses: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json({ expenseCategories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authRequest = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authRequest) {
    return authRequest.response;
  }
  try {
    const { name, description, staffId } = await request.json();

    // Validate required fields
    if (!name || !description || !staffId) {
      return NextResponse.json(
        { error: "Name, description, and staffId are required" },
        { status: 400 },
      );
    }

    // Check if category name already exists
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists" },
        { status: 409 },
      );
    }

    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        staffId: parseInt(staffId),
      },
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
