import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/permissions";

function generateCode(
  length = 20,
  charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_"
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
        codeCustomer: generateCode(),
        //credit: new Date(),
        deliveryDate: new Date(validateData.deliveryDate),

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
            urlPo: po.urlPo,
            date: new Date(),
            Product: {
              create: po.products.map((p) => ({
                SteelType: { connect: { codeSteel: p.steelType } },
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
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
