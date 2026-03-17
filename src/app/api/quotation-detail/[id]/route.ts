import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { CuttingMethod, ShapeSteel, status } from "@/types";
import { ApiQuotation } from "../../up-date-quotation/[id]/route";
import { generateCode } from "../../createNewOrder/route";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;

  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const Order = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        bill: {
          select: { id: true },
        },
        Quotation: true,
        Product: {
          orderBy: [{ sequence: "asc" }],
          include: {
            SteelType: true,
          },
        },
      },
    });
    if (!Order) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลใบเสนอราคา" },
        { status: 404 },
      );
    }

    if (!Order.Quotation) {
      return NextResponse.json(
        { error: "พบข้อผิดพลาดในฐานข้อมูล" },
        { status: 500 },
      );
    }

    const Quotation = Order.Quotation;
    const Product = Order.Product;

    const apiQuotation: ApiQuotation = {
      id: Quotation.id,
      idPO: Order.id,
      idBill: Order.bill?.id ?? null,
      customerId: Order.customerId ?? null,
      customerName: Quotation.customerName,
      companyName: Quotation.companyName,
      address: Quotation.address,
      tel: Quotation.tel,
      fax: Quotation.fax,
      credit: Quotation.credit,
      quotationNo: Quotation.quotationNo,
      salesName: Quotation.salesName,
      salesId: Quotation.salesNameId,
      description: Quotation.description ?? null,
      period: Quotation.period,
      deliveryDate: Quotation.deliveryDate,
      createdAt: Quotation.createdAt,
      updateAt: Quotation.updatedAt,
      steelItem: Product.map((steel) => ({
        SteelId: steel.steelId,
        steelType: steel.SteelType.codeSteel,
        shape: steel.SteelType.shape,
        sequence: steel.sequence,
        wide: steel.wide ?? null,
        length: steel.length,
        thickness: steel.thickness,
        amount: steel.amount,
        detail: steel.detail,
        cuttingMethod: steel.cuttingMethod,
        weight: steel.actualWeight,
        price: steel.unitPrice,
        discount: steel.discount ?? null,
        density: steel.SteelType.density,
        surfaceT: steel.surfaceT ?? null,
        toleranceT: steel.toleranceT ?? null,
        surfaceW: steel.surfaceW ?? null,
        toleranceW: steel.toleranceW ?? null,
        surfaceL: steel.surfaceL ?? null,
        toleranceL: steel.toleranceL ?? null,
        isOD: steel.isOD,
        isServices: steel.isServices,
        isPerAmount: steel.isPerAmount,
      })),
    };
    return NextResponse.json(apiQuotation, { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch Quotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authResult) return authResult.response;

  try {
    const orderPO = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        Quotation: true,
      },
    });

    if (!orderPO) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลใบเสนอราคา" },
        { status: 404 },
      );
    }

    if (orderPO.billId) {
      return NextResponse.json(
        { error: "ออเดอร์มีการสร้างบิลไปแล้ว" },
        { status: 400 },
      );
    }

    const saleNameId = orderPO.Quotation?.salesNameId;
    if (!saleNameId) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูล ID พนักงานขายในใบเสนอราคา" },
        { status: 400 },
      );
    }

    const saleName = await prisma.staff.findUnique({
      where: { id: saleNameId },
      include: { user: { select: { name: true } } },
    });

    if (!saleName) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลพนักงานขาย" },
        { status: 404 },
      );
    }

    const customerId = orderPO.customerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลลูกค้าในออเดอร์" },
        { status: 400 },
      );
    }

    const salesUserName = saleName.user?.name;
    if (!salesUserName) {
      return NextResponse.json(
        { error: "ไม่พบชื่อผู้ใช้งานของพนักงานขาย" },
        { status: 400 },
      );
    }

    const newBill = await prisma.bill.create({
      data: {
        Customer: { connect: { id: customerId } },
        codeCustomer: generateCode(),
        deliveryDate: new Date(),
        salesName: salesUserName,
        Staff_Bill_salesNameToStaff: { connect: { id: saleName.id } },
        Staff_Bill_deliveredByToStaff: { connect: { id: 10 } },
        deliveredBy: "นายวิรุณ ม่วงศรี",
        description: orderPO.Quotation?.description ?? null,
        subtotal: orderPO.Quotation?.subtotal ?? 0,
        discount: orderPO.Quotation?.discount ?? 0,
        vat: orderPO.Quotation?.vat ?? 0,
        grandTotal: orderPO.Quotation?.grandTotal ?? 0,
        credit: orderPO.Quotation?.credit,
        OrderPO: { connect: { id: orderPO.id } },
      },
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create bill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
