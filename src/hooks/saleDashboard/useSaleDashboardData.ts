"use client";

import { useEffect, useState } from "react";
import { billData } from "@/data/billData";
import { customerData } from "@/data/customerData";
import { expenseCategoryData } from "@/data/expenseCategoryData";
import { expenseData } from "@/data/expenseData";
import { orderPoData } from "@/data/orderPoData";
import { staffData } from "@/data/staffData";
import { staffIncomeData } from "@/data/staffIncomeData";
import { staffSalaryData } from "@/data/staffSalaryData";
import { typeStaffIncomeData } from "@/data/typeStaffIncomeData";
import { userData } from "@/data/userData";
import type { Bill } from "@/types/bill";
import type { Customer } from "@/types/customer";
import type { Expense } from "@/types/expense";
import type { ExpenseCategory } from "@/types/expenseCategory";
import type { OrderPO } from "@/types/orderPO";
import type { Staff } from "@/types/staff";
import type { StaffIncome } from "@/types/staffIncome";
import type { StaffSalary } from "@/types/staffSalary";
import type { TypeStaffIncome } from "@/types/typeStaffIncome";
import type { User } from "@/types/user";
type HookState<T, K extends string> = {
  loading: boolean;
  error: string | null;
} & Record<K, T[]>;

type FetchResult<T> = { data: T[]; error: string | null };

// Cast data fixtures to typed fallbacks for UI use when APIs fail
const billFallback = billData as unknown as Bill[];
const customerFallback = customerData as unknown as Customer[];
const orderFallback = orderPoData as unknown as OrderPO[];
const expenseFallback = expenseData as unknown as Expense[];
const expenseCategoryFallback =
  expenseCategoryData as unknown as ExpenseCategory[];
const staffFallback = staffData as unknown as Staff[];
const staffSalaryFallback = staffSalaryData as unknown as StaffSalary[];
const staffIncomeFallback = staffIncomeData as unknown as StaffIncome[];
const typeStaffIncomeFallback =
  typeStaffIncomeData as unknown as TypeStaffIncome[];
const userFallback = userData as unknown as User[];

async function fetchWithFallback<T>(
  url: string,
  extractor: (json: unknown) => T[],
  fallback: T[]
): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const json = await res.json();
    const data = extractor(json);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: fallback, error: message };
  }
}

function createHook<T, K extends string>(
  key: K,
  fetcher: () => Promise<FetchResult<T>>
) {
  return function useResource(): HookState<T, K> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;

      fetcher()
        .then((res) => {
          if (!mounted) return;
          setData(res.data);
          setError(res.error);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, []);

    return { [key]: data, loading, error } as HookState<T, K>;
  };
}

const arrayExtractor = <T>(json: unknown): T[] =>
  Array.isArray(json) ? json : [];

export const useCustomers = createHook<Customer, "customers">("customers", () =>
  fetchWithFallback<Customer>("/api/customer", arrayExtractor, customerFallback)
);

export const useStaff = createHook<Staff, "staff">("staff", () =>
  fetchWithFallback<Staff>("/api/staff", arrayExtractor, staffFallback)
);

export const useBills = createHook<Bill, "bills">("bills", () =>
  fetchWithFallback<Bill>("/api/bill", arrayExtractor, billFallback)
);

export const useOrders = createHook<OrderPO, "orders">("orders", () =>
  fetchWithFallback<OrderPO>("/api/orderPo", arrayExtractor, orderFallback)
);

export const useUsers = createHook<User, "users">("users", () =>
  fetchWithFallback<User>("/api/user", arrayExtractor, userFallback)
);

export const useExpenses = createHook<Expense, "expenses">("expenses", () =>
  fetchWithFallback<Expense>(
    "/api/expense",
    (json) =>
      Array.isArray((json as any)?.expenses) ? (json as any).expenses : [],
    expenseFallback
  )
);

export const useExpenseCategories = createHook<
  ExpenseCategory,
  "expenseCategories"
>("expenseCategories", () =>
  fetchWithFallback<ExpenseCategory>(
    "/api/expenseCategories",
    (json) =>
      Array.isArray((json as any)?.expenseCategories)
        ? (json as any).expenseCategories
        : [],
    expenseCategoryFallback
  )
);

export const useStaffSalaries = createHook<StaffSalary, "staffSalaries">(
  "staffSalaries",
  () =>
    fetchWithFallback<StaffSalary>(
      "/api/staffSalary",
      arrayExtractor,
      staffSalaryFallback
    )
);

export const useStaffIncomes = createHook<StaffIncome, "staffIncomes">(
  "staffIncomes",
  () =>
    fetchWithFallback<StaffIncome>(
      "/api/staffIncome",
      arrayExtractor,
      staffIncomeFallback
    )
);

export const useTypeStaffIncomes = createHook<
  TypeStaffIncome,
  "typeStaffIncomes"
>("typeStaffIncomes", () =>
  fetchWithFallback<TypeStaffIncome>(
    "/api/typeStaffIncome",
    arrayExtractor,
    typeStaffIncomeFallback
  )
);
