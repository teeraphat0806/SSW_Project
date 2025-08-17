import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../../lib/prisma";
import { CreateNewOrderSchema } from "../../../lib/schemas/createNewOrder.shema";

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
    const staff = await prisma.staff.findUnique({
      where: { name: session.user?.name },
    });

    if (!staff) {
      throw new Error(`Staff with name ${session.user?.name} not found`);
    }

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
        Staff_Bill_salesNameToStaff: { connect: { name: session.user?.name } },
        //Staff_Bill_deliveredByToStaff: { connect: { name: body.deliveredBy } },
        //description: body.description,
        //unitPrice: body.unitPrice,
        //discount: body.discount,
        vat: validateData.vat,
        //dateReceive: new Date(body.dateReceive),
        //typeBill: body.typeBill,
        OrderPO: {
          create: validateData.orderPOs.map((po: any) => ({
            poNumber: po.poNumber,
            Customer: { connect: { id: validateData.customerId } },
            total: po.total,
            vat: po.vat,
            urlPo: po.urlPo,
            date: new Date(),
            Product: {
              create: po.products.map((p: any) => ({
                steelType: p.steelType,
                wide: p.wide,
                length: p.length,
                thickness: p.thickness,
                amount: p.amount,
                total: p.total,
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
