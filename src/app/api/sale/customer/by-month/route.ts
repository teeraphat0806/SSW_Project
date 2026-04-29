import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
// API นี้ใช้สรุปลูกค้ายอดขายสูงสุดรายเดือนจากบิลที่ไม่ถูกยกเลิกและมีใบแจ้งหนี้
// UI: src/components/saledashboard2/CustomerSalesTable.tsx และ src/app/saledashboard2/page.tsx
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
    // ดึงพารามิเตอร์จาก query string
    const searchParams = req.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // ตรวจสอบพารามิเตอร์ที่จำเป็น
    if (!year || !month) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_PARAMETERS",
            message: "กรุณาระบุปีและเดือน",
            details: {
              required: ["year", "month"],
            },
          },
        },
        { status: 400 },
      );
    }

    const yearNumber = Number(year);
    const monthNumber = Number(month);

    // ตรวจสอบปี
    if (isNaN(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_YEAR",
            message: "ปีไม่ถูกต้อง กรุณาระบุปีระหว่าง 2000-2100",
            details: {
              field: "year",
              provided: yearNumber,
              expected: "2000-2100",
            },
          },
        },
        { status: 400 },
      );
    }

    // ตรวจสอบเดือน
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MONTH",
            message: "เดือนไม่ถูกต้อง กรุณาระบุเดือนระหว่าง 1-12",
            details: {
              field: "month",
              provided: monthNumber,
              expected: "1-12",
            },
          },
        },
        { status: 400 },
      );
    }

    const startOfMonth = new Date(yearNumber, monthNumber - 1, 1);
    const endOfMonth = new Date(yearNumber, monthNumber, 1);

    // ดึงบิลที่สร้างในเดือนนั้น และมีคำสั่งซื้อที่ไม่ถูกยกเลิกกับมีใบแจ้งหนี้แล้ว
    const bills = await prisma.bill.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
        OrderPO: {
          is: {
            status: { not: "canceled" },
            Invoice: { isNot: null },
          },
        },
      },
      include: {
        Customer: true,
      },
    });

    // จัดกลุ่มลูกค้าตาม ID และรวมยอดขายจากบิลที่เกี่ยวข้อง
    const customerMap = new Map<
      number,
      {
        id: number;
        name: string;
        code: string;
        totalSales: number;
        orderCount: number;
      }
    >();
    // วนผ่านบิลที่ได้มาแล้วจัดกลุ่มลูกค้าและรวมยอดขาย
    bills.forEach((bill) => {
      if (bill.Customer) {
        const customerId = bill.Customer.id;
        const existing = customerMap.get(customerId);

        if (existing) {
          existing.totalSales += bill.grandTotal || 0;
          existing.orderCount += 1;
        } else {
          customerMap.set(customerId, {
            id: bill.Customer.id,
            name: bill.Customer.name,
            code: bill.codeCustomer,
            totalSales: bill.grandTotal || 0,
            orderCount: 1,
          });
        }
      }
    });

    // แปลง Map เป็น Array แล้วเรียงยอดขายรวมจากมากไปน้อย
    const customersData = Array.from(customerMap.values()).sort(
      (a, b) => b.totalSales - a.totalSales,
    );

    const result = {
      success: true,
      data: customersData,
      meta: {
        year: yearNumber,
        month: monthNumber,
        totalCustomers: customersData.length,
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
