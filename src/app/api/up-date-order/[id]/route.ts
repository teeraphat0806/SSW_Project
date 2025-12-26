import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { custom, includes } from "zod";

type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTaxId: string;
  customerCode: string;
  customerFax: string;
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: "square" | "line";
  }[];
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const jobOrder = await prisma.orderPO.findUnique({
      where: { id: poId },
      include: {
        Product: {
          include: {
            SteelType: true,
          },
        },
        Customer: true,
      },
    });

    if (!jobOrder) {
      return NextResponse.json(
        { error: "Job order not found" },
        { status: 404 }
      );
    }
    if (!jobOrder.Customer || !jobOrder.Product) {
      return NextResponse.json(
        { error: "Order is missing Customer or Product relation" },
        { status: 500 }
      );
    }

    const Product = jobOrder.Product;
    const customer = jobOrder.Customer;

    const responseData: ApiJobOrder = {
      id: poId,
      poNumber: jobOrder.poNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.tel,
      customerAddress: customer.address,
      customerTaxId: customer.taxNumber,
      customerCode: customer.code,
      customerFax: customer.faxNumber,
      steel: Product.map((item) => ({
        steelType: item.SteelType.codeSteel,
        amount: item.amount,
        width: item.wide ?? undefined,
        length: item.length,
        thickness: item.thickness,
        detail: item.detail ?? undefined,
        weight: item.actualWeight ?? undefined,
        shape: item.SteelType.shape,
      })),
      status: jobOrder.status,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error fetching job order:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch job order";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
