import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { CreateNewQuotationSchema } from "@/lib/schemas/createNewQuotation.shema";

type createNewQuotationInput = z.infer<typeof CreateNewQuotationSchema>;
type OrderPO = createNewQuotationInput["orderPO"];
type Product = OrderPO["products"][number];

// ปัดเลขให้เหลือ 2 ตำแหน่ง
function round2(num: number) {
  return Math.round(num * 100) / 100;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const parsed = CreateNewQuotationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error },
        { status: 400 },
      );
    }

    const data: createNewQuotationInput = parsed.data;
    const orderPO: OrderPO = data.orderPO;
    const products: Product[] = orderPO.products;
    const steelPairs = Array.from(
      new Set(orderPO.products.map((p) => p.SteelId)),
    );

    const newQuotation = await prisma.$transaction(async (tx) => {
      const steelList = await tx.steelType.findMany({
        where: { id: { in: steelPairs } },
        select: {
          id: true,
          codeSteel: true,
          shape: true,
          density: true,
          price: true,
        },
      });

      const steelMap = new Map(steelList.map((s) => [s.id, s]));

      const calculatedProducts = orderPO.products.map((products, index) => {
        const steelInfo = steelMap.get(products.SteelId);
        const unitPrice = products.price ?? steelInfo?.price ?? 0;

        const result = calculateWeightDetails({
          shape: products.shape,
          amount: products.amount,
          length: products.length,
          width: products.wide ?? undefined,
          thickness: products.thickness,
          density: steelInfo?.density ?? 0.0000079,
          price: unitPrice,
          weight: products.weight ?? null,
          total: null,
          discount: products.discount ?? null,
          isOD: products.isOD ?? false,
          isServices: products.isServices ?? false,
          isPerAmount: products.isPerAmount ?? false,
        });
        return {
          products,
          steelInfo,
          unitPrice,
          total: result.total,
          index,
        };
      });
      const subtotal = round2(
        calculatedProducts.reduce((sum, item) => sum + item.total, 0),
      );

      const discount = round2(
        calculatedProducts.reduce(
          (sum, item) => sum + Number(item.products.discount ?? 0),
          0,
        ),
      );
      const subtotalAfterDiscount = subtotal - discount;
      const vat = round2(((subtotalAfterDiscount - discount) * 7) / 100);
      const grandTotal = round2(subtotalAfterDiscount + vat);

      return tx.quotation.create({
        data: {
          quotationNo: data.quotationNo,
          customer: data.customerId
            ? { connect: { id: data.customerId } }
            : undefined,
          customerName: data.customerName,
          companyName: data.companyName,
          address: data.address,
          tel: data.tel ?? null,
          fax: data.fax ?? null,
          credit: data.credit ?? undefined,
          salesName: data.salesName,
          staff: { connect: { id: data.salesNameId } },
          description: data.description ?? null,
          vatRate: data.vatRate ?? undefined,
          vat,
          subtotal,
          grandTotal,
          deliveryDate: data.deliveryDate,
          createdAt: data.createdAt ?? new Date(),

          OrderPO: {
            create: {
              Customer: data.customerId
                ? { connect: { id: data.customerId } }
                : undefined,
              total: subtotal,
              Product: {
                create: calculatedProducts.map((item) => ({
                  SteelType: { connect: { id: Number(item.products.SteelId) } },
                  sequence: item.products.sequence ?? item.index + 1,
                  wide: item.products.wide ?? undefined,
                  length: item.products.length,
                  thickness: item.products.thickness,
                  amount: item.products.amount,
                  surfaceT: item.products.surfaceT ?? null,
                  toleranceT: item.products.toleranceT ?? null,
                  surfaceW: item.products.surfaceW ?? null,
                  toleranceW: item.products.toleranceW ?? null,
                  surfaceL: item.products.surfaceL ?? null,
                  toleranceL: item.products.toleranceL ?? null,

                  unitPrice: item.products.price ?? item.steelInfo?.price ?? 0,
                  actualWeight: item.products.weight ?? null,
                  discount: item.products.discount ?? null,
                  detail: item.products.detail ?? null,
                  cuttingMethod: item.products.cuttingMethod ?? "normal",

                  isOD: item.products.isOD ?? false,
                  isServices: item.products.isServices ?? false,
                  isPerAmount: item.products.isPerAmount ?? false,

                  total: item.total,
                })),
              },
            },
          },
        },
        include: {
          customer: true,
          OrderPO: {
            include: {
              Product: true,
            },
          },
        },
      });
    });

    return NextResponse.json(newQuotation, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
