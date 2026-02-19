import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ JWT Token
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid token" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // ลบ "Bearer " ออก
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      // ตรวจสอบว่า token มี clientId ที่ถูกต้อง (optional)
      if (!payload.clientId) {
        return NextResponse.json(
          { error: "Invalid token payload" },
          { status: 401 },
        );
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or expired token" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const codeCustomer = searchParams.get("codeCustomer");

    if (!codeCustomer) {
      return NextResponse.json(
        { error: "codeCustomer parameter is required" },
        { status: 400 },
      );
    }

    // เชื่อมต่อ database และค้นหาข้อมูล
    // สมมติว่า call database ของคุณ
    const billData = await getBillByCustomerCode(codeCustomer);

    if (!billData) {
      return NextResponse.json(
        { error: "Bill not found at " + codeCustomer },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: billData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ฟังก์ชันตัวอย่าง - แทนที่ด้วย database queries ของคุณ
async function getBillByCustomerCode(codeCustomer: string) {
  try {
    const result1 = await prisma.bill.findFirst({
      where: { codeCustomer },
      include: {
        OrderPO: true,
      },
    });

    // ถ้าไม่เจอ Bill ให้ return null
    if (!result1) {
      return null;
    }

    const customer = await prisma.customer.findFirst({
      where: { id: result1.customerId },
    });

    // แยก OrderPO ออกจาก bill
    const { OrderPO, ...billWithoutOrderPO } = result1;
    // if(OrderPO.poNumber === null){
    //     return {
    //         bill: billWithoutOrderPO,
    //         orderPO: null,
    //         customer,
    //     };
    // }
    return {
      bill: billWithoutOrderPO,
      orderPO: OrderPO,
      customer,
    };
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return null;
  }
}
