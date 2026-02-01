// src/lib/calculations/pricing.ts

export type CuttingMethod = "normal" | "FB" | "steelDisc" | "CNC";

export type SteelItemForCalc = {
  amount: number;
  width?: number;
  length?: number;
  thickness?: number;
  density: number;
  price: number;
  weight?: number | null;
  total?: number | null; // CNC ใช้ช่องนี้
  discount?: number | null;
  cuttingMethod: CuttingMethod;
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

export function calculateBillSummary(
  steel: SteelItemForCalc[],
  vatRate: number,
) {
  console.log(
    "Calculating bill summary with steel items:",
    steel,
    "and VAT rate:",
    vatRate,
  );
  const subtotal = steel.reduce((sum, s) => {
    // CNC uses total field explicitly
    if (s.cuttingMethod === "CNC") {
      return sum + safeNum(s.total);
    }
    if (safeNum(s.weight) > 0) {
      return sum + safeNum(s.weight) * safeNum(s.price);
    }
    if (safeNum(s.width) > 0) {
      return (
        sum +
        safeNum(s.amount) *
          safeNum(s.width) *
          safeNum(s.length) *
          safeNum(s.thickness) *
          safeNum(s.density) *
          safeNum(s.price) *
          0.1
      );
    } else {
      return (
        sum +
        safeNum(s.amount) *
          safeNum(s.length) *
          safeNum(s.length) *
          safeNum(s.thickness) *
          safeNum(s.density) *
          safeNum(s.price) *
          0.1
      );
    }

    return sum;
  }, 0);

  const discount = steel.reduce((sum, s) => sum + safeNum(s.discount), 0);

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
