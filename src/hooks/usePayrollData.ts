"use client";
import { useEffect, useState } from "react";
import type { Employee, SalaryAdjustment } from "../types/payroll";
import type { OtherIncomeType } from "../lib/payroll-utils";
import {
  fetchEmployees,
  fetchOtherIncomeTypes,
  loadAdjustments,
} from "../lib/payroll-api";

export function usePayrollData() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>([]);
  const [otherIncomeTypes, setOtherIncomeTypes] = useState<OtherIncomeType[]>([
    { id: "ot", name: "OT", types: "increase" },
    { id: "late", name: "มาสาย", types: "decrease" },
  ]);
  const [loading, setLoading] = useState(true);
  const [adjustmentType, setAdjustmentType] = useState<"salary" | "other">(
    "salary",
  );

  // Initial data load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchEmployees().then(setEmployees),
      fetchOtherIncomeTypes().then(setOtherIncomeTypes),
    ])
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Load adjustments when type changes
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const data = await loadAdjustments(adjustmentType, ac.signal);
        setAdjustments(data);
      } catch (e: any) {
        if (e?.name !== "AbortError" && !ac.signal.aborted) {
          console.error(e);
        }
        if (!ac.signal.aborted) {
          setAdjustments([]);
        }
      }
    })();
    return () => ac.abort();
  }, [adjustmentType]);

  return {
    employees,
    setEmployees,
    adjustments,
    setAdjustments,
    otherIncomeTypes,
    setOtherIncomeTypes,
    loading,
    adjustmentType,
    setAdjustmentType,
  };
}
