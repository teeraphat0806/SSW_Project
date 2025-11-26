import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ codeCustomer: string }> }
) {
  const { codeCustomer } = await context.params;

  console.log("Postcode received:", codeCustomer);
  try {
    const bill = await prisma.bill.findUnique({
      where: { codeCustomer: codeCustomer },
    });
    const customer = await prisma.customer.findUnique({
      where: { id: bill?.customerId },
    });
    const orderPO = await prisma.orderPO.findMany({
      where: { billId: bill?.id },
    });
    const product = await prisma.product.findMany({
      where: { orderPOId: { in: orderPO.map((order) => order.id) } },
    });
    return NextResponse.json(
      { bill, customer, orderPO, product },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch postcode" + e },
      { status: 500 }
    );
  }
}
