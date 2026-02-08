import type { SalaryAdjustment } from "../types/payroll";

/* =========================
   Types
========================= */
export type OtherIncomeType = {
  id: string;
  name: string;
  defaultAmount?: number;
  types?: string;
};

export type TimeframeMode = "year" | "past-5" | "past-10" | "all";
export type ChartMetric = "salary" | "other" | "increase" | "decrease" | "net";

/* =========================
   Helper Functions
========================= */

/**
 * ตรวจสอบว่ารายการปรับเป็นรายได้อื่นหรือไม่
 */
export function isOtherIncome(
  adj: SalaryAdjustment,
  types: OtherIncomeType[],
): boolean {
  // ถ้ามี nameIncome แสดงว่าเป็นรายได้อื่นจาก staffIncome table
  if (adj.nameIncome) {
    return true;
  }
  // fallback: เช็คจาก detail ถ้าไม่มี nameIncome
  if (!adj.detail) return false;
  const detailLower = adj.detail.toLowerCase().trim();
  return types.some((t) => detailLower.includes(t.name.toLowerCase().trim()));
}

/**
 * ตรวจสอบว่าวันที่อยู่ในช่วงเวลาที่เลือกหรือไม่
 */
export function inTimeframeMode(
  dateISO: string,
  mode: TimeframeMode,
  selectedYear?: number,
): boolean {
  const d = new Date(dateISO);
  const now = new Date();
  if (mode === "year") {
    if (selectedYear == null) return true;
    return d.getFullYear() === selectedYear;
  }
  if (mode === "past-5") {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 5);
    return d >= from && d <= now;
  }
  if (mode === "past-10") {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 10);
    return d >= from && d <= now;
  }
  return true;
}

/**
 * ตรวจสอบว่าเป็นรายการหักเงินหรือไม่
 */
export function isDeduction(name?: string, detail?: string): boolean {
  const n = name ?? "";
  const d = detail ?? "";
  // เดาแบบง่ายๆ จาก prefix/code และคำสำคัญภาษาไทย
  return (
    /^(DEDUCT|PENALTY|FINE|WITHHOLD)/i.test(n) ||
    /(หัก|ค่าปรับ|ปรับเงิน|ผิดระเบียบ)/.test(d)
  );
}

/**
 * แปลงข้อมูลรายได้อื่นจาก API response
 */
export function mapIncome(r: any): SalaryAdjustment {
  return {
    id: String(r.id),
    staffId: String(r.staffId),
    amount: Number(r.amount) ?? 0,
    detail: r.detail ?? r.name ?? "",
    nameIncome: r.nameIncome || r.name, // เก็บ nameIncome จาก API
    date: new Date(r.date ?? r.createdAt ?? Date.now())
      .toISOString()
      .slice(0, 10),
    type: isDeduction(r.name, r.detail) ? "decrease" : "increase",
  };
}

/**
 * แปลงข้อมูลเงินเดือนจาก API response
 */
export function mapSalary(r: any): SalaryAdjustment {
  return {
    id: String(r.id),
    staffId: String(r.staffId),
    amount: Number(r.amount) ?? 0,
    detail: r.detail ?? "ปรับเงินเดือน",
    date: new Date(r.effectiveDate ?? r.createdAt ?? Date.now())
      .toISOString()
      .slice(0, 10),
    type: "increase",
  };
}

/**
 * คำนวณประเภทรายได้จากจำนวนเงิน
 */
export function inferTypesFromAmount(
  amt: number | undefined,
): "increase" | "decrease" {
  return (amt ?? 0) < 0 ? "decrease" : "increase";
}
