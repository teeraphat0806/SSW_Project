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

  const bytes: Uint8Array = randomBytes(length * 2);
  const result: string[] = [];
  const max = 256 - (256 % n);

  let i = 0;
  while (result.length < length) {
    if (i >= bytes.length) {
      const more = randomBytes(length);
      const tmp = new Uint8Array(more);
      for (let j = 0; j < tmp.length; j++) bytes[i + j] = tmp[j];
    }
    const rnd = bytes[i++]!;
    if (rnd < max) result.push(chars[rnd % n]!);
  }
  return result.join("");
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const cm3ToM3 = (cm3: number) => cm3 / 1_000_000;
const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

type SteelShape = "square" | "line";

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

  let weightPerPieceKg = 0;

  if (params.shape === "square") {
    if (width <= 0) return 0;
    const volume = width * length * thickness;
    weightPerPieceKg = volume * density * 0.1;
  } else {
    const volume = length * length * thickness;
    weightPerPieceKg = volume * density * 0.1;
  }

  return weightPerPieceKg * amount; // ✅ น้ำหนักรวมทั้งรายการ (kg)
}

function calcLine(params: {
  amount: number;
  weight?: number | null; // ✅ น้ำหนักจริงที่กรอกมา (ตามที่คุณต้องการ: “คิดกับจำนวนด้วย”)
  width?: number | null;
  length: number;
  thickness: number;
  steel: { price: number; density: number; shape: SteelShape };
}) {
  const price = safeNum(params.steel.price);
  const amount = safeNum(params.amount);
  const manualWeight = safeNum(params.weight);

  if (manualWeight > 0) {
    const totalWeightKg = manualWeight * amount;
    const total = round2(totalWeightKg * price);
    return {
      weightKg: round2(totalWeightKg),
      total,
      isManual: true as const,
    };
  }

  const computedWeightKg = calcComputedWeightKg({
    shape: params.steel.shape,
    amount,
    width: params.width ?? null,
    length: params.length,
    thickness: params.thickness,
    density: params.steel.density,
  });

  const total = round2(computedWeightKg * price);
  return {
    weightKg: round2(computedWeightKg),
    total,
    isManual: false as const,
  };
}

type SteelFromDB = {
  id: number;
  codeSteel: string;
  price: number;
  density: number;
  shape: "square" | "line"; // ตรงกับ enum ของ Prisma
};

export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);
  if ("response" in authResult) return authResult.response;

  const { session } = authResult;

  try {
    const body = await req.json();

    const parsed = CreateNewOrderSchema.safeParse(body);

    if (!parsed.success) {
      console.log("Zod issues:", parsed.error.issues);

      const formattedErrors = parsed.error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        { error: "Invalid input", details: formattedErrors },
        { status: 400 }
      );
    }
    for (let i = 0; i < parsed.data.orderPOs.length; i++) {
      const products = parsed.data.orderPOs[i].products;

      if (products.length === 0) {
        return NextResponse.json(
          { error: ` ต้องมีสินค้าอย่างน้อย 1 รายการ` },
          { status: 400 }
        );
      }

      if (products.length > 15) {
        return NextResponse.json(
          { error: `เพิ่มสินค้าได้ไม่เกิน 15 รายการ` },
          { status: 400 }
        );
      }
    }

    const data = parsed.data;

    const allCodes = Array.from(
      new Set(
        data.orderPOs.flatMap((po) =>
          po.products.map((p) => String(p.steelType).trim())
        )
      )
    );

    const newBill = await prisma.$transaction(async (tx) => {
      const steelTypes = await tx.steelType.findMany({
        where: { codeSteel: { in: allCodes } },
        select: {
          id: true,
          codeSteel: true,
          price: true,
          density: true,
          shape: true,
        },
      });

      const mapSteel = new Map<string, SteelFromDB>(
        steelTypes.map((s) => [s.codeSteel, s])
      );

      const missing = allCodes.filter((c) => !mapSteel.has(c));
      if (missing.length)
        throw new Error(`SteelType not found: ${missing.join(", ")}`);

      const bill = await tx.bill.create({
        data: {
          Customer: { connect: { id: data.customerId } },
          yourRef: data.yourRef,
          codeCustomer: generateCode(),
          deliveryDate: new Date(data.deliveryDate),

          salesName: session.user?.name,
          Staff_Bill_salesNameToStaff: {
            connect: { id: Number(session.user?.id) },
          },
          vat: data.vat,

          OrderPO: {
            create: data.orderPOs.map((po) => {
              const computed = po.products.map((p) => {
                const code = String(p.steelType).trim();
                const st = mapSteel.get(code)!;

                // Prisma enum ของคุณคือ ShapeSteel แต่ค่าคือ square/line อยู่แล้ว
                const shape = st.shape as unknown as SteelShape;

                const line = calcLine({
                  amount: p.amount,
                  width: p.wide ?? null,
                  length: p.length,
                  thickness: p.thickness,
                  steel: {
                    price: st.price,
                    density: st.density,
                    shape,
                  },
                });

                return { st, p, line };
              });

              const poTotal = round2(
                computed.reduce((sum, x) => sum + x.line.total, 0)
              );

              return {
                poNumber: po.poNumber,
                Customer: { connect: { id: data.customerId } },
                urlPo: po.urlPo,
                total: poTotal,

                Product: {
                  create: computed.map(({ st, p, line }) => ({
                    SteelType: { connect: { id: st.id } },
                    length: p.length,
                    thickness: p.thickness,
                    amount: p.amount,
                    detail: p.detail ?? null,
                    cuttingMethod: p.cuttingMethod ?? "normal",
                    // ✅ total ปัด 2 ตำแหน่งก่อนลง
                    total: line.total,
                  })),
                },
              };
            }),
          },
        },
        include: {
          Customer: true,
          OrderPO: { include: { Product: true } },
        },
      });

      return bill;
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
