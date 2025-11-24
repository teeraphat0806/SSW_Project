import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ codeCustomer: string }> }
) {
  const { codeCustomer } = await context.params;

  console.log("Postcode received:", codeCustomer);
  try {
    const result = await prisma.bill.findUnique({
      where: { codeCustomer: codeCustomer },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch postcode" + e },
      { status: 500 }
    );
  }
}
