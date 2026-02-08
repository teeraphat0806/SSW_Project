import type { Employee, SalaryAdjustment } from "../types/payroll";
import type { OtherIncomeType } from "./payroll-utils";
import { mapIncome, mapSalary } from "./payroll-utils";
import { toast } from "react-toastify";

/* =========================
   Employee APIs
========================= */

/**
 * ดึงข้อมูลพนักงานทั้งหมด
 */
export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/staff");
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data: Employee[] = await res.json();
  return data.map((e) => ({
    ...e,
    name: e.user?.name ?? e.staffName ?? "",
  }));
}

/**
 * อัพเดตเงินเดือนพนักงาน
 */
export async function updateEmployeeSalary(
  staffId: string | number,
  newSalary: number,
): Promise<void> {
  const res = await fetch(`/api/staff/${staffId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ currentSalary: newSalary }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
}

/* =========================
   Adjustment APIs
========================= */

/**
 * โหลดข้อมูลการปรับรายได้
 */
export async function loadAdjustments(
  adjustmentType: "salary" | "other",
  signal?: AbortSignal,
): Promise<SalaryAdjustment[]> {
  const isSalary = adjustmentType === "salary";
  const url = isSalary ? "/api/staffSalary" : "/api/staffIncome";

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}): ${msg || "Unknown error"}`);
  }

  const data: SalaryAdjustment[] = await res.json();
  const mapped = (isSalary ? data.map(mapSalary) : data.map(mapIncome)).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return mapped;
}

/**
 * เพิ่มรายได้อื่น
 */
export async function addStaffIncome(
  staffId: number,
  amount: number,
  detail: string,
  nameIncome: string,
): Promise<void> {
  const res = await fetch("/api/staffIncome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ staffId, amount, detail, nameIncome }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);

  toast.success("เพิ่มรายได้พนักงานสำเร็จ", { position: "bottom-right" });
}

/**
 * เพิ่มบันทึกการปรับเงินเดือน
 */
export async function addStaffSalary(
  staffId: number,
  amount: number,
  detail: string,
): Promise<void> {
  const res = await fetch("/api/staffSalary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ staffId, amount, detail }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);

  toast.success("อัพเดตรายได้พนักงานสำเร็จ", { position: "bottom-right" });
}

/**
 * ลบรายได้อื่น
 */
export async function deleteStaffIncome(id: string | number): Promise<void> {
  const res = await fetch(`/api/staffIncome/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  toast.success("ลบผู้ใช้งานสำเร็จ", { position: "bottom-right" });
}

/* =========================
   Other Income Type APIs
========================= */

/**
 * ดึงข้อมูลประเภทรายได้อื่น
 */
export async function fetchOtherIncomeTypes(): Promise<OtherIncomeType[]> {
  const res = await fetch("/api/typeStaffIncome");
  if (!res.ok) throw new Error("Failed to fetch typeStaffIncome");
  const data: OtherIncomeType[] = await res.json();
  return data.map((item) => ({
    id: String(item.id),
    name: item.name,
    defaultAmount: Number(item.defaultAmount),
    types: item.types,
  }));
}

/**
 * เพิ่มประเภทรายได้อื่น
 */
export async function addOtherIncomeType(
  name: string,
  defaultAmount: number,
  types: "increase" | "decrease",
): Promise<OtherIncomeType> {
  const body = {
    name: name.trim(),
    amount: Number(defaultAmount ?? 0),
    types,
  };

  const res = await fetch("/api/typeStaffIncome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.ok) {
    toast.success("เพิ่มรายได้พนักงานสำเร็จ", { position: "bottom-right" });
  }
  if (!res.ok) throw new Error(await res.text());

  const created = await res.json();
  return {
    id: String(created.id),
    name: created.name,
    defaultAmount: Number(created.amount),
    types: created.types,
  };
}

/**
 * แก้ไขประเภทรายได้อื่น
 */
export async function updateOtherIncomeType(
  id: string,
  name: string,
  defaultAmount: number,
  types: "increase" | "decrease",
): Promise<Partial<OtherIncomeType>> {
  const body = {
    name: name.trim(),
    amount: defaultAmount,
    types,
  };

  const res = await fetch(`/api/typeStaffIncome/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (res.ok) {
    toast.success("อัพเดตรายได้พนักงานสำเร็จ", { position: "bottom-right" });
  }
  if (!res.ok) throw new Error(await res.text());

  const updated = await res.json();
  return {
    name: updated.name,
    defaultAmount: Number(updated.amount),
    types: updated.types,
  };
}

/**
 * ลบประเภทรายได้อื่น
 */
export async function removeOtherIncomeType(id: string): Promise<boolean> {
  const res = await fetch(`/api/typeStaffIncome/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ onDelete: true }),
  });

  if (res.ok) {
    toast.success("ลบรายได้พนักงานสำเร็จ", { position: "bottom-right" });
  }
  if (!res.ok) {
    toast.error(`${await res.text()}`, { position: "bottom-right" });
  }
  return true;
}
