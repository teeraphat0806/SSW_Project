// src/lib/calculations/pricing.ts
import { ShapeSteel } from "@/types";

export type SteelItem = {
  shape: ShapeSteel;
  amount: number;
  width?: number;
  length?: number;
  thickness?: number;
  density: number;

  price: number;
  weight?: number | null;
  total?: number | null;
  discount?: number | null;

  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const round2 = (n: number) => Math.round(n * 100) / 100;

type WeightDetails = {
  weight: number;
  total: number;
  discount: number;
  isManual: boolean;
};

export function calculateWeightDetails(steel: SteelItem): WeightDetails {
  const amount = safeNum(steel.amount);
  const width = safeNum(steel.width);
  const length = safeNum(steel.length);
  const thickness = safeNum(steel.thickness);

  const density = safeNum(steel.density) || 7860;
  const weight = safeNum(steel.weight);
  const price = safeNum(steel.price);
  const discount = safeNum(steel.discount);

  if (steel.isServices || steel.isPerAmount) {
    return {
      weight,
      total: round2(amount * price),
      discount,
      isManual: true,
    };
  }

  if (amount <= 0 || length <= 0 || thickness <= 0)
    return {
      weight: 0,
      total: 0,
      discount,
      isManual: false,
    };

  if (weight > 0) {
    return {
      weight: round2(weight * amount),
      total: round2(weight * amount * price),
      discount,
      isManual: true,
    };
  }
  let weightPerPieceKg = 0;

  if (steel.isOD) {
    if (steel.shape !== "square") {
      return {
        weight: 0,
        total: 0,
        discount,
        isManual: false,
      };
    }
    weightPerPieceKg = (width * width * length * density * 0.14) / 4;
  } else if (steel.shape === "square") {
    weightPerPieceKg = thickness * width * length * density;
  } else {
    weightPerPieceKg = (thickness * length * length * density * 0.14) / 4;
  }

  return {
    //คือนหนักรวมเป็นกิโลกรัมโดย/1000 คือ
    weight: round2(weightPerPieceKg * amount),
    total: round2(weightPerPieceKg * amount * price),
    discount,
    isManual: false,
  };
}

export function calculateBillSummary(steel: SteelItem[], vatRate: number) {
  const subtotal = steel.reduce((sum, steel) => {
    return sum + safeNum(calculateWeightDetails(steel).total);
  }, 0);

  const discount = steel.reduce(
    (sum, steel) => sum + safeNum(steel.discount),
    0,
  );
  const net = Math.max(0, subtotal - discount);
  const vat = net * (safeNum(vatRate) / 100);
  const grandTotal = round2(net + vat);

  return {
    subtotal,
    discount,
    vat,
    grandTotal,
  };
}
