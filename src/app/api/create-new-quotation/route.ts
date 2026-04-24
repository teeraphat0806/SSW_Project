import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { calculateWeightDetails, digitsOnly } from "@/lib/calculateGrandTotal";
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
      let CustomerId: number | undefined = data.customerId;
      if (!CustomerId) {
        if (!data.companyName || !data.address) {
          throw new Error(
            "Customer information is required when customerId is not provided.",
          );
        }
        let telSearch = null;
        if (data.tel) {
          telSearch = digitsOnly(data.tel);
        }
        let faxNumberSearch = null;
        if (data.fax) {
          faxNumberSearch = digitsOnly(data.fax);
        }
        const newCustomer = await tx.customer.create({
          data: {
            name: data.companyName,
            address: data.address,
            tel: data.tel ?? null,
            telSearch: telSearch,
            faxNumber: data.fax ?? null,
            faxNumberSearch: faxNumberSearch,
            taxNumber: data.tax ?? null,
            email: data.email ?? null,
          },
        });

        CustomerId = newCustomer.id;
      }

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
          discount: null,
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

      const vat = round2(((subtotal - discount) * 7) / 100);
      const grandTotal = round2(subtotal - discount + vat);

      return tx.quotation.create({
        data: {
          quotationNo: data.quotationNo,
          customer: { connect: { id: CustomerId } },
          customerName: data.customerName,
          credit: data.credit ?? undefined,
          salesName: data.salesName,
          staff: { connect: { id: data.salesNameId } },
          description: data.description ?? null,
          vatRate: data.vatRate ?? undefined,
          vat,
          subtotal,
          discount,
          grandTotal,
          period: data.period,
          deliveryDate: data.deliveryDate,
          createdAt: data.createdAt ?? new Date(),

          OrderPO: {
            create: {
              Customer: CustomerId
                ? { connect: { id: CustomerId } }
                : undefined,
              total: subtotal,
              Product: {
                create: calculatedProducts.map((item) => ({
                  SteelType: { connect: { id: Number(item.products.SteelId) } },
                  sequence: item.index + 1,
                  wide: item.products.wide || null,
                  length: item.products.length || null,
                  thickness: item.products.thickness || null,
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
