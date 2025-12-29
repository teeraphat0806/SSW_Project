import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { se, tr } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";
import z, { custom, includes } from "zod";

type statusType =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

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
  status: statusType;
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

const StatusSchema = z.enum([
  "pending",
  "cutting",
  "weighing",
  "ready",
  "shipped",
  "completed",
]);

const SteelLineSchema = z.object({
  codeSteel: z.string().trim().min(1),
  amount: z.number().int().min(1),
  width: z.number().nonnegative().nullable().optional(),
  length: z.number().nonnegative(),
  thickness: z.number().nonnegative(),
  weight: z.number().nonnegative().nullable().optional(),
  detail: z.string().nullable().optional(),
});

const PatchSchema = z.object({
  status: StatusSchema.optional(),
  customerId: z.string().trim().optional(),
  steel: z.array(SteelLineSchema).optional(),
});

type UpdateOrderPayload = {
  status?: statusType;
  customerId?: string;
  steel?: Array<{
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string;
  }>;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const poId = Number(id);
    if (Number.isNaN(poId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const patch = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.orderPO.findUnique({
        where: { id: poId },
        select: { id: true },
      });
      if (!existing) throw new Error("Order not found");

      // customerId (ถ้ามีส่งมา)
      let nextCustomerId: number | undefined = undefined;
      if (typeof patch.customerId === "string") {
        const cid = Number(patch.customerId);
        if (!Number.isInteger(cid) || cid <= 0)
          throw new Error("Invalid customerId");

        const customer = await tx.customer.findUnique({
          where: { id: cid },
          select: { id: true },
        });
        if (!customer) throw new Error("Customer not found");

        nextCustomerId = cid;
      }

      // update header
      await tx.orderPO.update({
        where: { id: poId },
        data: {
          ...(patch.status ? { status: patch.status } : {}),
          ...(nextCustomerId !== undefined
            ? { customerId: nextCustomerId }
            : {}),
        },
      });

      // update lines
      if (patch.steel) {
        const codes = Array.from(
          new Set(
            patch.steel
              .map((l) => l.codeSteel?.trim())
              .filter((x): x is string => !!x)
          )
        );

        const steelTypes = await tx.steelType.findMany({
          where: { codeSteel: { in: codes } },
          select: {
            id: true,
            codeSteel: true,
            price: true,
            density: true,
            shape: true,
          },
        });

        const codeToSteel = new Map(steelTypes.map((s) => [s.codeSteel, s]));
        const missing = codes.filter((c) => !codeToSteel.has(c));
        if (missing.length)
          throw new Error(`SteelType not found: ${missing.join(", ")}`);

        await tx.product.deleteMany({ where: { orderPOId: poId } });

        await tx.product.createMany({
          data: patch.steel.map((l) => {
            const st = codeToSteel.get(l.codeSteel.trim())!;
            return {
              orderPOId: poId,
              steelId: st.id,
              wide: l.width ?? null,
              length: l.length ?? null,
              thickness: l.thickness ?? null,
              amount: l.amount,
              detail: l.detail ?? null,
              actualWeight: l.weight ?? null,
              total: 0,
            };
          }),
        });

        const sum = await tx.product.aggregate({
          where: { orderPOId: poId },
          _sum: { total: true },
        });

        await tx.orderPO.update({
          where: { id: poId },
          data: { total: sum._sum.total ?? 0 },
        });
      }

      // ✅ re-fetch แบบ include เพื่อ map ออกเป็น ApiJobOrder
      const order = await tx.orderPO.findUnique({
        where: { id: poId },
        include: {
          Product: { include: { SteelType: true } },
          Customer: true,
        },
      });

      if (!order || !order.Customer)
        throw new Error("Order not found after update");

      const customer = order.Customer;

      const responseData: ApiJobOrder = {
        id: order.id,
        poNumber: order.poNumber,
        customerId: String(customer.id),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.tel,
        customerAddress: customer.address,
        customerTaxId: customer.taxNumber,
        customerCode: customer.code,
        customerFax: customer.faxNumber,
        steel: order.Product.map((p) => ({
          steelType: p.SteelType.codeSteel,
          amount: p.amount,
          width: p.wide ?? undefined,
          length: p.length ?? 0,
          thickness: p.thickness ?? 0,
          detail: p.detail ?? null,
          weight: p.actualWeight ?? null,
          shape: p.SteelType.shape,
        })),
        status: order.status,
      };

      return responseData;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
