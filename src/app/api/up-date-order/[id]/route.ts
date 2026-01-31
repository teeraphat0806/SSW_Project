import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { se, th, tr } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";
import z, { custom, includes } from "zod";

type statusType =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed"
  | "canceled";

type ApiJobOrder = {
  id: number;
  poNumber: string | null;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTaxId: string;
  customerCode: string | null;
  customerFax: string;
  steel: {
    id: number;
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: "square" | "line";
    job: number | null;
    cuttingMethod: "normal" | "FB" | "steelDisc" | "CNC";
  }[];
  status: statusType;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
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
        { status: 404 },
      );
    }
    if (!jobOrder.Customer || !jobOrder.Product) {
      return NextResponse.json(
        { error: "Order is missing Customer or Product relation" },
        { status: 500 },
      );
    }

    const Product = jobOrder.Product;
    const customer = jobOrder.Customer;

    const responseData: ApiJobOrder = {
      id: poId,
      poNumber: jobOrder.poNumber || null,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.tel,
      customerAddress: customer.address,
      customerTaxId: customer.taxNumber,
      customerCode: customer.code || null,
      customerFax: customer.faxNumber,
      steel: Product.map((item) => ({
        id: item.id,
        steelType: item.SteelType.codeSteel,
        amount: item.amount,
        width: item.wide ?? undefined,
        length: item.length ?? 0,
        thickness: item.thickness ?? 0,
        detail: item.detail ?? undefined,
        weight: item.actualWeight ?? undefined,
        job: item.job ?? null,
        cuttingMethod: item.cuttingMethod ?? "normal",
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
  "canceled",
]);

const SteelLineSchema = z.object({
  codeSteel: z.string().trim().min(1),
  amount: z.number().int().min(1),
  width: z.number().nonnegative().nullable().optional(),
  length: z.number().nonnegative(),
  thickness: z.number().nonnegative(),
  weight: z.number().nonnegative().nullable().optional(),
  detail: z.string().nullable().optional(),
  cuttingMethod: z.enum(["normal", "FB", "steelDisc", "CNC"]).optional(),
  job: z.number().int().nullable().optional(),
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
    id: number;
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string;
  }>;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const cm3ToM3 = (cm3: number) => cm3 / 1_000_000;

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

type SteelShape = "square" | "line"; // ให้ตรงกับ enum ที่คุณใช้จริง

function calcComputedWeightKg(params: {
  shape: SteelShape;
  amount: number;
  width?: number | null;
  length: number;
  thickness: number;
  density: number; // kg/m3
}) {
  const amount = safeNum(params.amount);
  const width = safeNum(params.width);
  const length = safeNum(params.length);
  const thickness = safeNum(params.thickness);
  const density = safeNum(params.density) || 7860;

  if (amount <= 0 || length <= 0 || thickness <= 0) return 0;

  // ใช้ shape เป็นหลัก ถ้า square = แผ่น, line = กลม/เส้น
  let weightPerPieceKg = 0;

  if (params.shape === "square") {
    // plate: volume = w * l * t (cm3)
    // ถ้าไม่ได้ส่ง width มาให้ถือว่า 0 -> จะได้ weight 0 (กันพัง)
    if (width <= 0) return 0;

    const volumeCm3 = width * length * thickness;
    weightPerPieceKg = cm3ToM3(volumeCm3) * density;
  } else {
    // line/round: thickness = diameter (cm)
    const r = thickness / 2;
    const areaCm2 = Math.PI * r * r;
    const volumeCm3 = areaCm2 * length;
    weightPerPieceKg = cm3ToM3(volumeCm3) * density;
  }

  const totalWeightKg = weightPerPieceKg * amount;
  return totalWeightKg;
}

function calcLine(params: {
  amount: number;
  weight?: number | null; // น้ำหนักจริงที่กรอกมา (ถ้ามี)
  width?: number | null;
  length: number;
  thickness: number;
  steel: { price: number; density: number; shape: SteelShape };
}) {
  const price = safeNum(params.steel.price);
  const manualWeight = safeNum(params.weight);

  // 1) มีน้ำหนักจริง -> ใช้น้ำหนักจริง (ถือว่าเป็น "น้ำหนักรวมของรายการ" แล้ว)
  if (manualWeight > 0) {
    const total = manualWeight * price;
    return { weightKg: manualWeight, total };
  }

  // 2) ไม่มีน้ำหนักจริง -> คำนวณจากมิติ + density + shape + amount
  const computedWeightKg = calcComputedWeightKg({
    shape: params.steel.shape,
    amount: params.amount,
    width: params.width ?? null,
    length: params.length,
    thickness: params.thickness,
    density: params.steel.density,
  });

  const total = round2(computedWeightKg * price);
  return { weightKg: round2(computedWeightKg), total };
}
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const poId = Number(id);
    if (Number.isNaN(poId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    console.log("PATCH body:", body);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.issues);
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 },
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
          ...(patch.status === "completed" ? { completedAt: new Date() } : {}),
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
              .filter((x): x is string => !!x),
          ),
        );

        if (patch.steel.length === 0) {
          throw new Error("ต้องมีรายการเหล็กอย่างน้อย 1 รายการ");
        }
        if (patch.steel.length > 15) {
          throw new Error("เพิ่มสินค้าได้ไม่เกิน 15 รายการ");
        }
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

        const codeToSteel = new Map<string, (typeof steelTypes)[0]>(
          steelTypes.map((s) => [s.codeSteel, s]),
        );
        const missing = codes.filter((c) => !codeToSteel.has(c));
        if (missing.length)
          throw new Error(`SteelType not found: ${missing.join(", ")}`);
        await tx.product.deleteMany({ where: { orderPOId: poId } });

        await tx.product.createMany({
          data: patch.steel.map((l) => {
            const st = codeToSteel.get(l.codeSteel.trim())!;

            const { total } = calcLine({
              amount: l.amount,
              weight: l.weight ?? null,
              width: l.width ?? null,
              length: l.length,
              thickness: l.thickness,
              steel: {
                price: st.price,
                density: st.density,
                shape: st.shape as "square" | "line", // <- ถ้า st.shape เป็น enum ใน prisma TS มันจะเทียบได้เอง ให้ลบทิ้ง cast ได้
              },
            });

            return {
              orderPOId: poId,
              steelId: st.id,
              wide: l.width ?? null,
              length: l.length ?? null,
              thickness: l.thickness ?? null,
              amount: l.amount,
              detail: l.detail ?? null,
              unitPrice: st.price,
              actualWeight: l.weight ?? null,
              job: l.job ?? null,
              cuttingMethod: l.cuttingMethod ?? "normal",

              // total คำนวณตามเงื่อนไขใหม่
              total,
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

        const subtotal = sum._sum.total ?? 0;
        const orderWithBill = await tx.orderPO.findUnique({
          where: { id: poId },
          select: {
            billId: true,
            customerId: true,
          },
        });

        if (!orderWithBill) throw new Error("Order not found");

        let bill;

        if (orderWithBill.billId) {
          // 🔁 มี Bill อยู่แล้ว → update
          bill = await tx.bill.findUnique({
            where: { id: orderWithBill.billId },
            select: { id: true, vatRate: true },
          });

          if (!bill) throw new Error("Bill not found");

          const vatRate = bill.vatRate ?? 7;
          const vat = round2(subtotal * (vatRate / 100));
          const grandTotal = round2(subtotal + vat);

          await tx.bill.update({
            where: { id: bill.id },
            data: {
              subtotal,
              vat,
              grandTotal,
            },
          });
        } else {
          throw new Error("No bill associated with this order");
        }
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
        poNumber: order.poNumber ?? null,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.tel,
        customerAddress: customer.address,
        customerTaxId: customer.taxNumber,
        customerCode: customer.code || null,
        customerFax: customer.faxNumber,
        steel: order.Product.map((p) => ({
          id: p.id,
          steelType: p.SteelType.codeSteel,
          amount: p.amount,
          width: p.wide ?? undefined,
          length: p.length ?? 0,
          thickness: p.thickness ?? 0,
          detail: p.detail ?? null,
          weight: p.actualWeight ?? null,
          shape: p.SteelType.shape,
          job: p.job ?? null,
          cuttingMethod: p.cuttingMethod ?? "normal",
        })),
        status: order.status,
      };
      console.log("Updated order:", responseData);
      return responseData;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
