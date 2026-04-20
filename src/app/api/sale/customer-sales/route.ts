import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { requireAuth } from "@/lib/permissions";
// API นี้ใช้ดึงรายการขายแบบละเอียด พร้อมกรอง ค้นหา เรียงลำดับ และแบ่งหน้า
// UI: src/components/saledashboard2/CustomerSalesTable.tsx
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const customerId = searchParams.get("customerId");
    const customerName = searchParams.get("customerName");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

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

    // เรียงได้เฉพาะวันที่ ยอดขาย จำนวน และชื่อลูกค้า
    const validSortBy = ["date", "amount", "quantity", "customer"];
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_BY",
            message: "sortBy ไม่ถูกต้อง",
            details: {
              field: "sortBy",
              provided: sortBy,
              expected: validSortBy.join(", "),
            },
          },
        },
        { status: 400 },
      );
    }

    // ตรวจสอบว่า sortOrder ต้องเป็น asc หรือ desc เท่านั้น
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_SORT_ORDER",
            message: "sortOrder ไม่ถูกต้อง",
            details: {
              field: "sortOrder",
              provided: sortOrder,
              expected: "asc, desc",
            },
          },
        },
        { status: 400 },
      );
    }

    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    const startOfMonth = new Date(yearNumber, monthNumber - 1, 1);
    const endOfMonth = new Date(yearNumber, monthNumber, 1);

    const startDate = new Date(startOfMonth);
    const endDate = new Date(endOfMonth);
    // ถ้ามี dateFrom และ dateTo ให้ปรับช่วงวันที่ตามนั้นได้ แต่ต้องอยู่ในเดือนที่เลือก
    if (dateFrom) {
      const parsedFrom = new Date(`${dateFrom}T00:00:00.000Z`);
      if (Number.isNaN(parsedFrom.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_FROM",
              message: "รูปแบบ dateFrom ไม่ถูกต้อง",
              details: { field: "dateFrom", provided: dateFrom },
            },
          },
          { status: 400 },
        );
      }
      if (parsedFrom > startDate) {
        startDate.setTime(parsedFrom.getTime());
      }
    }
    // dateTo เป็นแบบ exclusive คือถ้าใส่ 2024-06-30 จะเอาบิลที่สร้างถึงวันที่ 2024-06-29 23:59:59 เท่านั้น ไม่รวมบิลที่สร้างวันที่ 2024-06-30
    if (dateTo) {
      const parsedTo = new Date(`${dateTo}T00:00:00.000Z`);
      if (Number.isNaN(parsedTo.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_DATE_TO",
              message: "รูปแบบ dateTo ไม่ถูกต้อง",
              details: { field: "dateTo", provided: dateTo },
            },
          },
          { status: 400 },
        );
      }
      // ปรับ dateTo ให้เป็นแบบ exclusive
      const parsedToExclusive = new Date(parsedTo);
      parsedToExclusive.setUTCDate(parsedToExclusive.getUTCDate() + 1);

      if (parsedToExclusive < endDate) {
        endDate.setTime(parsedToExclusive.getTime());
      }
    }
    // ถ้า startDate มากกว่าหรือเท่ากับ endDate แสดงว่าไม่มีช่วงวันที่ให้ดึงข้อมูล ให้ส่งผลลัพธ์เป็น array ว่าง
    if (startDate >= endDate) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
          meta: {
            year: yearNumber,
            month: monthNumber,
            monthName: monthNames[monthNumber - 1],
            totalAmount: 0,
            totalQuantity: 0,
            currency: "THB",
          },
        },
        { status: 200 },
      );
    }

    // ดึงบิลที่สร้างในเดือนนั้น และมีคำสั่งซื้อที่ไม่ถูกยกเลิกกับมีใบแจ้งหนี้แล้ว
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
      OrderPO: {
        is: {
          status: { not: "canceled" },
          Invoice: { isNot: null },
        },
      },
    };

    // ถ้ามี customerId หรือ customerName ให้เพิ่มเงื่อนไขการกรองตามนั้น
    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    if (customerName) {
      whereClause.Customer = {
        name: {
          contains: customerName,
          mode: "insensitive",
        },
      };
    }

    // ถ้าใช้ customerName ต้องเชื่อมกับตาราง Customer ด้วย
    let orderByClause: any = {};
    if (sortBy === "date") {
      orderByClause = { createdAt: sortOrder };
    } else if (sortBy === "amount") {
      orderByClause = { grandTotal: sortOrder };
    } else if (sortBy === "customer") {
      orderByClause = { Customer: { name: sortOrder } };
    } else if (sortBy === "quantity") {
      // สำหรับ quantity ต้องจัดการต่างออกไป เพราะเป็นจำนวนสินค้ารวม
      orderByClause = { createdAt: sortOrder }; // ใช้วันที่แทนไปก่อน
    }

    // นับจำนวนบิลทั้งหมดที่ตรงกับเงื่อนไข เพื่อใช้ในการแบ่งหน้า
    const total = await prisma.bill.count({
      where: whereClause,
    });

    // นับจำนวนบิลที่ตรงกับเงื่อนไขแยกตามลูกค้า เพื่อแสดงจำนวนคำสั่งซื้อของแต่ละลูกค้าในผลลัพธ์
    const billsByCustomer = await prisma.bill.groupBy({
      by: ["customerId"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // สร้างแผนที่จาก customerId ไปยังจำนวนบิลของลูกค้าแต่ละราย เพื่อใช้แสดงจำนวนคำสั่งซื้อ
    const customerBillCount = new Map<number, number>();
    billsByCustomer.forEach((item) => {
      customerBillCount.set(item.customerId, item._count.id);
    });

    // ดึงข้อมูลบิลที่ตรงกับเงื่อนไข พร้อมข้อมูลลูกค้าและคำสั่งซื้อที่เกี่ยวข้อง โดยเรียงลำดับและแบ่งหน้าตาม page กับ limit
    const skip = (page - 1) * limit;
    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        Customer: true,
        OrderPO: {
          select: {
            codetoinvoice: true,
            Invoice: {
              select: {
                invoiceNo: true,
              },
            },
            Product: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
      orderBy: orderByClause,
      skip,
      take: limit,
    });

    // รวมจำนวนสินค้าของแต่ละบิลจากค่า amount ใน Product เพื่อใช้แสดงจำนวนสินค้าในผลลัพธ์
    const allBills = await prisma.bill.aggregate({
      where: whereClause,
      _sum: {
        grandTotal: true,
      },
      _count: {
        id: true,
      },
    });

    // แปลงข้อมูลบิลให้อยู่ในรูปแบบที่ต้องการ โดยรวมข้อมูลลูกค้า ยอดขาย จำนวนสินค้า และข้อมูลประกอบอื่น ๆ
    const formattedData = bills.map((bill) => {
      const date = bill.createdAt;
      const quantity =
        bill.OrderPO?.Product.reduce(
          (sum, product) => sum + (product.amount || 0),
          0,
        ) || 0;

      return {
        id: bill.id,
        date: date.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        dateISO: date.toISOString().split("T")[0],
        customer: bill.Customer
          ? {
              id: bill.Customer.id,
              code: bill.codeCustomer,
              name: bill.Customer.name,
            }
          : null,
        amount: bill.grandTotal || 0,
        subtotal: bill.subtotal || 0,
        vat: bill.vat || 0,
        quantity,
        billId: bill.id,
        codetoinvoice: bill.OrderPO?.codetoinvoice || null,
        invoiceNo: bill.OrderPO?.Invoice?.invoiceNo?.toString() || null,
        formatted: {
          date: date.toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          amount: `฿${(bill.grandTotal || 0).toLocaleString("en-US")}`,
          subtotal: `฿${(bill.subtotal || 0).toLocaleString("en-US")}`,
          vat: `฿${(bill.vat || 0).toLocaleString("en-US")}`,
          quantity: `${quantity}`,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    const result = {
      success: true,
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta: {
        year: yearNumber,
        month: monthNumber,
        monthName: monthNames[monthNumber - 1],
        totalAmount: allBills._sum.grandTotal || 0,
        totalQuantity: allBills._count.id || 0,
        currency: "THB",
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
