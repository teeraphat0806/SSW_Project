import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { CuttingMethod } from "@/types";

function ThaiBaht(numberStr: string) {
  for (let i = 0; i < numberStr.length; i++) {
    numberStr = numberStr.replace(",", "");
    numberStr = numberStr.replace(" ", "");
    numberStr = numberStr.replace("บาท", "");
    numberStr = numberStr.replace("฿", "");
  }

  const TxtNumArr = new Array(
    "ศูนย์",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
    "สิบ",
  );
  const TxtDigitArr = new Array("", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน");
  let BahtText = "";

  if (isNaN(Number(numberStr))) {
    return "ข้อมูลนำเข้าไม่ถูกต้อง";
  }

  if (Number(numberStr) > 9999999.9999) {
    return "ข้อมูลนำเข้าเกินขอบเขตที่ตั้งไว้";
  }

  const parts = numberStr.split(".");
  if (parts[1] && parts[1].length > 0) {
    parts[1] = parts[1].substring(0, 2);
  }

  const NumberLen = parts[0].length;
  for (let i = 0; i < NumberLen; i++) {
    const tmp = Number(parts[0].substring(i, i + 1));
    if (tmp !== 0) {
      if (i === NumberLen - 1 && tmp === 1) {
        BahtText += "เอ็ด";
      } else if (i === NumberLen - 2 && tmp === 2) {
        BahtText += "ยี่";
      } else if (i === NumberLen - 2 && tmp === 1) {
        BahtText += "";
      } else {
        BahtText += TxtNumArr[tmp];
      }
      BahtText += TxtDigitArr[NumberLen - i - 1];
    }
  }

  BahtText += "บาท";

  if (parts[1] === "0" || parts[1] === "00") {
    BahtText += "ถ้วน";
  } else {
    const DecimalLen = (parts[1] || "").length;
    for (let i = 0; i < DecimalLen; i++) {
      const tmp = Number((parts[1] || "").substring(i, i + 1));
      if (tmp !== 0) {
        if (i === DecimalLen - 1 && tmp === 1) {
          BahtText += "เอ็ด";
        } else if (i === DecimalLen - 2 && tmp === 2) {
          BahtText += "ยี่";
        } else if (i === DecimalLen - 2 && tmp === 1) {
          BahtText += "";
        } else {
          BahtText += TxtNumArr[tmp];
        }
        BahtText += TxtDigitArr[DecimalLen - i - 1];
      }
    }
    BahtText += "สตางค์";
  }

  return BahtText;
}

type ApiReceipt = {
  id: number;
  poId: number | null;
  subtotal: number | null;
  grandTotal: number | null;
  invoice: number | null;
  dateCreateInvoice?: Date | null;
  recentlyInvoice: number;
  deliveryDate: Date;
  credit: number;
  selesName: string | null;
  discount?: number | null;
  vat: number;
  vatRate: number | null;
  totalTextThai: string;
  customer: {
    id: number;
    name: string;
    address: string;
    taxNumber: string | null;
    tel: string | null;
    faxNumber: string | null;
  };
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length: number | null;
    thickness: number | null;
    price: number;
    weight: number | null;
    total: number;
    job?: string | null;
    cuttingMethod?: CuttingMethod;
    discount?: number | null;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }[];
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - Missing or invalid token" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

      if (!payload.clientId) {
        return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
      }
    } catch {
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

    const billData = await getBillByCustomerCode(codeCustomer);

    if (!billData) {
      return NextResponse.json(
        { error: "Bill not found at " + codeCustomer },
        { status: 404 },
      );
    }

    const { receipt, ...legacyData } = billData;

    return NextResponse.json({
      data: legacyData,
      receipt,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getBillByCustomerCode(codeCustomer: string) {
  try {
    const result = await prisma.bill.findFirst({
      where: { codeCustomer },
      include: {
        Customer: true,
        OrderPO: {
          include: {
            Product: {
              include: {
                SteelType: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    const { OrderPO, Customer, ...billWithoutOrderPO } = result;
    const customer = Customer;
    let receipt: ApiReceipt | null = null;

    if (OrderPO && customer) {
      const invoice = await prisma.invoice.findUnique({
        where: { codetoinvoice: OrderPO.codetoinvoice },
        select: { invoiceNo: true, createdAt: true },
      });
      const latestInvoice = await prisma.invoice.findFirst({
        orderBy: { invoiceNo: "desc" },
        select: { invoiceNo: true },
      });
      const grandTotal = result.grandTotal ?? 0;

      const steel = OrderPO.Product.map((p) => ({
        steelType: p.SteelType.codeSteel,
        amount: p.amount,
        width: p.wide ?? 0,
        length: p.length,
        thickness: p.thickness,
        price: p.unitPrice,
        weight: p.actualWeight,
        job: p.job,
        cuttingMethod: p.cuttingMethod,
        discount: p.discount ?? undefined,
        total: p.total ?? 0,
        isOD: p.isOD,
        isServices: p.isServices,
        isPerAmount: p.isPerAmount,
      }));

      receipt = {
        id: result.id,
        poId: OrderPO.id,
        subtotal: result.subtotal,
        grandTotal: result.grandTotal,
        deliveryDate: result.deliveryDate,
        invoice: invoice ? invoice.invoiceNo : null,
        dateCreateInvoice: invoice ? invoice.createdAt : null,
        credit: result.credit,
        vat: result.vat,
        vatRate: result.vatRate,
        discount: result.discount ?? undefined,
        totalTextThai: ThaiBaht(grandTotal.toString()),
        recentlyInvoice: latestInvoice?.invoiceNo ?? 0,
        selesName: result.salesName,
        customer: {
          id: customer.id,
          name: customer.name,
          address: customer.address,
          taxNumber: customer.taxNumber,
          tel: customer.tel ?? "",
          faxNumber: customer.faxNumber ?? "",
        },
        steel,
      };
    }

    return {
      bill: billWithoutOrderPO,
      orderPO: OrderPO,
      customer,
      receipt,
    };
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return null;
  }
}
