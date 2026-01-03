// src/app/api/receipt/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { includes } from "zod";

function ThaiBaht(numberStr: string) {
  //ตัดสิ่งที่ไม่ต้องการทิ้งลงโถส้วม
  for (var i = 0; i < numberStr.length; i++) {
    numberStr = numberStr.replace(",", ""); //ไม่ต้องการเครื่องหมายคอมมาร์
    numberStr = numberStr.replace(" ", ""); //ไม่ต้องการช่องว่าง
    numberStr = numberStr.replace("บาท", ""); //ไม่ต้องการตัวหนังสือ บาท
    numberStr = numberStr.replace("฿", ""); //ไม่ต้องการสัญลักษณ์สกุลเงินบาท
  }
  //สร้างอะเรย์เก็บค่าที่ต้องการใช้เอาไว้
  var TxtNumArr = new Array(
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
    "สิบ"
  );
  var TxtDigitArr = new Array("", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน");
  var BahtText = "";
  //ตรวจสอบดูซะหน่อยว่าใช่ตัวเลขที่ถูกต้องหรือเปล่า ด้วย isNaN == true ถ้าเป็นข้อความ == false ถ้าเป็นตัวเลข
  if (isNaN(Number(numberStr))) {
    return "ข้อมูลนำเข้าไม่ถูกต้อง";
  } else {
    //ตรวสอบอีกสักครั้งว่าตัวเลขมากเกินความต้องการหรือเปล่า
    if (Number(numberStr) - 0 > 9999999.9999) {
      return "ข้อมูลนำเข้าเกินขอบเขตที่ตั้งไว้";
    } else {
      //พรากทศนิยม กับจำนวนเต็มออกจากกัน (บาปหรือเปล่าหนอเรา พรากคู่เขา)
      const parts = numberStr.split(".");
      //ขั้นตอนต่อไปนี้เป็นการประมวลผลดูกันเอาเองครับ แบบว่าขี้เกียจจะจิ้มดีดแล้ว อิอิอิ
      if (parts[1] && parts[1].length > 0) {
        parts[1] = parts[1].substring(0, 2);
      }
      var NumberLen = parts[0].length - 0;
      for (var i = 0; i < NumberLen; i++) {
        var tmp = Number(parts[0].substring(i, i + 1)) - 0;
        if (tmp != 0) {
          if (i == NumberLen - 1 && tmp == 1) {
            BahtText += "เอ็ด";
          } else if (i == NumberLen - 2 && tmp == 2) {
            BahtText += "ยี่";
          } else if (i == NumberLen - 2 && tmp == 1) {
            BahtText += "";
          } else {
            BahtText += TxtNumArr[tmp];
          }
          BahtText += TxtDigitArr[NumberLen - i - 1];
        }
      }
      BahtText += "บาท";
      if (parts[1] == "0" || parts[1] == "00") {
        BahtText += "ถ้วน";
      } else {
        var DecimalLen = (parts[1] || "").length - 0;
        for (var i = 0; i < DecimalLen; i++) {
          var tmp = Number((parts[1] || "").substring(i, i + 1)) - 0;
          if (tmp != 0) {
            if (i == DecimalLen - 1 && tmp == 1) {
              BahtText += "เอ็ด";
            } else if (i == DecimalLen - 2 && tmp == 2) {
              BahtText += "ยี่";
            } else if (i == DecimalLen - 2 && tmp == 1) {
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
  }
}

type ApiReceipt = {
  id: number;
  yourRef: string;
  subtotal: number | null;
  grandTotal: number | null;
  deliveryDate: Date;
  credit: number;
  selesName: string | null;
  vat: number;
  totalTextThai: string;
  customer: {
    id: number;
    name: string;
    address: string;
    taxNumber: string;
    tel: string;
    faxNumber: string;
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
  }[];
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const receiptId = Number(id);

  if (Number.isNaN(receiptId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const receipt = await prisma.bill.findUnique({
      where: { id: receiptId },
      include: {
        Customer: true,
        OrderPO: {
          include: {
            Product: {
              // <- อันนี้ต้องเป็นชื่อ relation จริงใน OrderPO
              include: {
                SteelType: true,
              },
            },
          },
        },
      },
    });
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    if (!receipt.Customer || !receipt.OrderPO) {
      return NextResponse.json(
        { error: "Incomplete receipt data" },
        { status: 500 }
      );
    }
    const customer = receipt.Customer;
    console.log("steel items:", receipt);
    const grandTotal = receipt.grandTotal ?? 0;
    const apiReceipt: ApiReceipt = {
      id: receipt.id,
      yourRef: receipt.yourRef,
      subtotal: receipt.subtotal,
      grandTotal: receipt.grandTotal,
      deliveryDate: receipt.deliveryDate,
      credit: receipt.credit,
      vat: receipt.vat,
      totalTextThai: ThaiBaht(grandTotal.toString()),
      selesName: receipt.salesName,
      customer: {
        id: customer.id,
        name: customer.name,
        address: customer.address,
        taxNumber: customer.taxNumber,
        tel: customer.tel,
        faxNumber: customer.faxNumber,
      },
      steel: receipt.OrderPO.flatMap((po) =>
        po.Product.map((p) => ({
          steelType: p.SteelType.codeSteel,
          amount: p.amount,
          width: p.wide ?? 0,
          length: p.length,
          thickness: p.thickness,
          price: p.SteelType.price,
          weight: p.actualWeight,
          total: p.total,
        }))
      ),
    };

    return NextResponse.json(apiReceipt);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" + error },
      { status: 500 }
    );
  }
}
