// src/app/api/receipt/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { includes } from "zod";

function ThaiBaht(Number) {
  //ตัดสิ่งที่ไม่ต้องการทิ้งลงโถส้วม
  for (var i = 0; i < Number.length; i++) {
    Number = Number.replace(",", ""); //ไม่ต้องการเครื่องหมายคอมมาร์
    Number = Number.replace(" ", ""); //ไม่ต้องการช่องว่าง
    Number = Number.replace("บาท", ""); //ไม่ต้องการตัวหนังสือ บาท
    Number = Number.replace("฿", ""); //ไม่ต้องการสัญลักษณ์สกุลเงินบาท
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
  if (isNaN(Number)) {
    return "ข้อมูลนำเข้าไม่ถูกต้อง";
  } else {
    //ตรวสอบอีกสักครั้งว่าตัวเลขมากเกินความต้องการหรือเปล่า
    if (Number - 0 > 9999999.9999) {
      return "ข้อมูลนำเข้าเกินขอบเขตที่ตั้งไว้";
    } else {
      //พรากทศนิยม กับจำนวนเต็มออกจากกัน (บาปหรือเปล่าหนอเรา พรากคู่เขา)
      Number = Number.split(".");
      //ขั้นตอนต่อไปนี้เป็นการประมวลผลดูกันเอาเองครับ แบบว่าขี้เกียจจะจิ้มดีดแล้ว อิอิอิ
      if (Number[1].length > 0) {
        Number[1] = Number[1].substring(0, 2);
      }
      var NumberLen = Number[0].length - 0;
      for (var i = 0; i < NumberLen; i++) {
        var tmp = Number[0].substring(i, i + 1) - 0;
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
      if (Number[1] == "0" || Number[1] == "00") {
        BahtText += "ถ้วน";
      } else {
        var DecimalLen = Number[1].length - 0;
        for (var i = 0; i < DecimalLen; i++) {
          var tmp = Number[1].substring(i, i + 1) - 0;
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
  subtotal: number;
  grandTotal: number;
  deliveryDate: Date;
  credit: string;
  selesName: string;
  vat: number;
  totalTextThai: string;
  customer: {
    id: number;
    name: string;
    address: string;
    taxId: string;
    tel: string;
    fax: string;
    tax: string;
  };
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    price: number;
    weight: number;
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
    console.log("Receipt fetched:", receipt);
    const apiReceipt: ApiReceipt = {
      id: receipt.id,
      yourRef: receipt.yourRef,
      subtotal: receipt.subtotal,
      grandTotal: receipt.grandTotal,
      deliveryDate: receipt.deliveryDate,
      credit: "30",
      vat: receipt.vat,
      totalTextThai: ThaiBaht(receipt.grandTotal.toString()),
      selesName: receipt.salesName,
      customer: {
        id: customer.id,
        name: customer.name,
        address: customer.address,
        taxId: customer.taxId,
        tel: customer.tel,
        fax: customer.faxNumber,
        tax: customer.taxNumber,
      },
      steel: receipt.OrderPO.flatMap((po) =>
        po.Product.map((p) => ({
          steelType: p.SteelType.codeSteel,

          amount: p.amount,
          width: p.width ?? 0,
          length: p.length,
          thickness: p.thickness,
          price: p.price,
          weight: p.weight,
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
