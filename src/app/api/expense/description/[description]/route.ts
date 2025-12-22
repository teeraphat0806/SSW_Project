import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ description: string }> }
) {
  try {
    const authResult = await requireAuth([
      "superadmin",
      "supervisor",
      "clerk",
      "delivery",
    ]);

    if ("response" in authResult) {
      return authResult.response;
    }
    const { description } = await context.params;

    if (!description || description.trim() === "") {
      return NextResponse.json(
        { error: "Description parameter is required" },
        { status: 400 }
      );
    }

    // Example: const expenses = await db.expenses.findMany({
    //   where: { name: { contains: name, mode: 'insensitive' } }
    // });

    const expenses = await prisma.expense.findMany({
      where: {
        description: {
          contains: description,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
