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
      where: { codeCustomer },
    });

    // กรณีไม่พบ bill ตาม codeCustomer
    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found for given codeCustomer" },
        { status: 404 }
      );
    }

    // ถ้ามี customerId ถึงจะยิง findUnique ถ้าไม่มีก็ให้เป็น null ไป
    const customer =
      bill.customerId != null
        ? await prisma.customer.findUnique({
            where: { id: bill.customerId },
          })
        : null;

    const orderPO = await prisma.orderPO.findMany({
      where: { billId: bill.id },
    });

    const product =
      orderPO.length > 0
        ? await prisma.product.findMany({
            where: { orderPOId: { in: orderPO.map((order) => order.id) } },
          })
        : [];

    return NextResponse.json(
      { bill, customer, orderPO, product },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Failed to fetch postcode: " + message },
      { status: 500 }
    );
  }
}
