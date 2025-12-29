"use client";

import { useState } from "react";
import { YearSelector } from "@/components/saleDashboard/year-selector";
import { SalesDashboard } from "@/components/saleDashboard/sales-dashboard";
import { IncomeExpenseDashboard } from "@/components/saleDashboard/income-expense-dashboard";
import { getAvailableYears } from "@/lib/saleDashboard/analytics-utils";

type DashboardMode = "sales" | "income-expense";

export default function DashboardPage() {
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || 2024);
  const [mode, setMode] = useState<DashboardMode>("sales");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                แดชบอร์ดบริษัท
              </h1>
              <p className="text-muted-foreground mt-1">
                ระบบวิเคราะห์ข้อมูลธุรกิจ
              </p>
            </div>
            <div className="flex items-center gap-4">
              <YearSelector
                years={availableYears}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Mode Tabs */}
      <div className="border-b bg-card print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setMode("sales")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                mode === "sales"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              แดชบอร์ดยอดขาย
            </button>
            <button
              onClick={() => setMode("income-expense")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                mode === "income-expense"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              แดชบอร์ดรายได้และรายจ่าย
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {mode === "sales" ? (
          <SalesDashboard year={selectedYear} />
        ) : (
          <IncomeExpenseDashboard year={selectedYear} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            ระบบแดshบอร์ดวิเคราะห์ธุรกิจ © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
