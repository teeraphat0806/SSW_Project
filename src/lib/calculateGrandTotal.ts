// src/lib/calculations/pricing.ts

export type CuttingMethod = "normal" | "FB" | "steelDisc" | "CNC";

export type SteelItemForCalc = {
  price: number;
  weight?: number | null;
  total?: number | null;      // CNC ใช้ช่องนี้
  discount?: number | null;
  cuttingMethod: CuttingMethod;
};

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function calculateBillSummary(
  steel: SteelItemForCalc[],
  vatRate: number,
) {
  const subtotal = steel.reduce((sum, s) => {
    if (s.cuttingMethod === "CNC") {
      return sum + safeNum(s.total);
    }
    return sum + safeNum(s.weight) * safeNum(s.price);
  }, 0);

  const discount = steel.reduce(
    (sum, s) => sum + safeNum(s.discount),
    0,
  );

  const net = Math.max(0, subtotal - discount);
  const vat = net * (safeNum(vatRate) / 100);
  const grandTotal = net + vat;

  return {
    subtotal,
    discount,
    vat,
    grandTotal,
  };
}
