import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { randomBytes } from "crypto";


function  generateCode(
  length = 20,
  charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()-_=+[]{};:,.?/\\|~"
) {
  if (length <= 0) return "";
  const chars = charset;
  const n = chars.length;
  if (n < 2) throw new Error("charset ต้องมีอักขระอย่างน้อย 2 ตัว");

  const bytes: Uint8Array = randomBytes(length * 2); // กันเผื่อทิ้งบาง byte
  const result: string[] = [];
  const max = 256 - (256 % n); // ใช้เฉพาะค่า < max เพื่อลด modulo bias

  let i = 0;
  while (result.length < length) {
    if (i >= bytes.length) {
      // ไม่พอ ก็ขอเพิ่ม
      const more = randomBytes(length);
      const tmp = new Uint8Array(more);
      for (let j = 0; j < tmp.length; j++) bytes[i + j] = tmp[j];
    }
    const rnd = bytes[i++]!;
    if (rnd < max) {
      result.push(chars[rnd % n]!);
    }
  }
  return result.join("");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  console.log("Session:", session);
  if (
    !session ||
    !["superadmin", "supervisor", "clerk"].includes(session.user?.role)
  ) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  if (!session?.user?.name) {
    return NextResponse.json(
      { error: "User name not found in session" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const result = CreateNewOrderSchema.safeParse(body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Invalid input", details: formattedErrors },
        { status: 400 }
      );
    }

    const validateData = result.data;

    const newBill = await prisma.bill.create({
      data: {
        Customer: { connect: { id: validateData.customerId } },
        yourRef: validateData.yourRef,
        invoiceNo: validateData.invoiceNo,
        codeCustomer: generateCode(),
        credit: new Date(),
        deliveryDate: new Date(validateData.deliveryDate),
        deliveryOrderNo: validateData.deliveryOrderNo,
        salesName: session.user?.name,
        Staff_Bill_salesNameToStaff: {
          connect: { id: Number(session.user?.id) },
        },
        vat: validateData.vat,
        OrderPO: {
          create: validateData.orderPOs.map((po) => ({
            poNumber: po.poNumber,
            Customer: { connect: { id: validateData.customerId } },
            total: po.total,
            vat: po.vat,
            urlPo: po.urlPo,
            date: new Date(),
            Product: {
              create: po.products.map((p) => ({
                SteelType: p.steelType,
                wide: p.wide,
                length: p.length,
                thickness: p.thickness,
                amount: p.amount,
                total: p.total,
                detail: p.detail,
              })),
            },
          })),
        },
      },
      include: {
        Customer: true,
        OrderPO: { include: { Product: true } },
      },
    });
    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Error creating bill" },
      { status: 500 }
    );
  }
}
