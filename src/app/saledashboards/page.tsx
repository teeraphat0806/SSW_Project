"use client";

import { useState, useMemo } from "react";
import { YearSelector } from "@/components/saleDashboard/year-selector";
import { SalesDashboard } from "@/components/saleDashboard/sales-dashboard";
import { IncomeExpenseDashboard } from "@/components/saleDashboard/income-expense-dashboard";
import { useSaleAnalytics } from "@/hooks/saleDashboard/useSaleAnalytics";

type DashboardMode = "sales" | "income-expense";

export default function DashboardPage() {
  const { years, loading } = useSaleAnalytics();
  const [selectedYear, setSelectedYear] = useState(years[0] || 2024);
  const [mode, setMode] = useState<DashboardMode>("sales");

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="print:hidden">
        <div className="p-4 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                แดชบอร์ดยอดขาย
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                ระบบวิเคราะห์ข้อมูลธุรกิจ
              </p>
            </div>
            <div className="flex items-center gap-4">
              <YearSelector
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Mode Tabs */}
      <div className="print:hidden">
        <div className="p-4 md:p-8">
          <div className="flex gap-2 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 w-fit">
            <button
              onClick={() => setMode("sales")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "sales"
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              แดชบอร์ดยอดขาย
            </button>
            <button
              onClick={() => setMode("income-expense")}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === "income-expense"
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              รายได้และรายจ่าย
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {mode === "sales" ? (
          <SalesDashboard year={selectedYear} />
        ) : (
          <IncomeExpenseDashboard year={selectedYear} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 print:hidden">
        <div className="p-4 md:p-8">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            ระบบแดชบอร์ดวิเคราะห์ธุรกิจ © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
