"use client";

import { DashboardHeader } from "@/components/saleDashboard/dashboard-header";
import { KPICardsGrid } from "@/components/saleDashboard/kpi-cards-grid";
import { MonthlyDataTable } from "@/components/saleDashboard/monthly-data-table";
import { SalesBarChart } from "@/components/saledashboard2/SalesBarChart";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface KPISummaryData {
  salesAmount: {
    total: number;
    formatted: string;
  };
  salesQuantity: {
    total: number;
    formatted: string;
  };
  income: {
    total: number;
    formatted: string;
  };
  expense: {
    total: number;
    formatted: string;
  };
  netProfit: {
    total: number;
    formatted: string;
    percentage: number;
  };
}

interface MonthlyDataItem {
  month: number;
  monthName: string;
  salesAmt: number;
  salesQty: number;
  income: number;
  expense: number;
  net: number;
  formatted: {
    salesAmt: string;
    salesQty: string;
    income: string;
    expense: string;
    net: string;
  };
}

export default function SaleDashboard2Page() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [kpiData, setKpiData] = useState<KPISummaryData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch KPI Summary
        const kpiResponse = await fetch(
          `/api/sale/kpi-summary/${selectedYear}`,
        );
        if (!kpiResponse.ok) {
          throw new Error("Failed to fetch KPI data");
        }
        const kpiResult = await kpiResponse.json();
        setKpiData(kpiResult.data);

        // Fetch Monthly Data
        const monthlyResponse = await fetch(
          `/api/sale/monthly-data/${selectedYear}`,
        );
        if (!monthlyResponse.ok) {
          throw new Error("Failed to fetch monthly data");
        }
        const monthlyResult = await monthlyResponse.json();
        setMonthlyData(monthlyResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-full flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="mr-2 h-12 w-12 animate-spin" />
          <p className="text-lg mt-4 ">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-full mx-auto flex flex-col items-center justify-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!kpiData) return null;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8 mt-10 md:mt-0 lg:mt-0">
        <DashboardHeader
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        <KPICardsGrid data={kpiData} />

        {/* Sales Bar Chart */}
        <SalesBarChart data={monthlyData} year={selectedYear} />

        {/* Monthly Data Table */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">ข้อมูลรายเดือน</h2>
          <MonthlyDataTable data={monthlyData} year={selectedYear} />
        </div>
      </div>
    </div>
  );
}
