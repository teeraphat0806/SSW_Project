import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { CreateNewOrderSchema } from "@/lib/schemas/createNewOrder.shema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  // Fix: Only allow if role is superadmin OR supervisor
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
    // หา staffId จาก session user name
    // const staff = await prisma.staff.findUnique({
    //   where: { userId: session.user?.id },
    //   include: { user: true },
    // });

    // const user = staff?.user

    // if (!staff) {
    //   throw new Error(`Staff with name ${session.user?.name} not found`);
    // }

    const result = CreateNewOrderSchema.safeParse(body);

    if(!result.success){
     const formattedErrors = result.error.issues.map(err => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return NextResponse.json(
    { error: 'Invalid input', details: formattedErrors },
    { status: 400 }
  );
}

    const validateData = result.data;

    const newBill = await prisma.bill.create({
      data: {
        Customer: { connect: { id: validateData.customerId } },
        yourRef: validateData.yourRef,
        invoiceNo: validateData.invoiceNo,
        credit: new Date(),
        deliveryDate: new Date(validateData.deliveryDate),
        deliveryOrderNo: validateData.deliveryOrderNo,
        salesName: session.user?.name,
        Staff_Bill_salesNameToStaff: { connect: { id: Number(session.user?.id)}},
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
