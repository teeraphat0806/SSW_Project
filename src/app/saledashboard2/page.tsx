"use client";

import { DashboardHeader } from "@/components/saleDashboard/dashboard-header";
import { KPICardsGrid } from "@/components/saleDashboard/kpi-cards-grid";
import { MonthlyDataTable } from "@/components/saleDashboard/monthly-data-table";
import { SalesBarChart } from "@/components/saledashboard2/SalesBarChart";
import { PrintReportModal } from "@/components/saledashboard2/PrintReportModal";
import { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface Customer {
  id: number;
  name: string;
  code: string;
}

export default function SaleDashboard2Page() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [kpiData, setKpiData] = useState<KPISummaryData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Print modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<
    "invoice" | "receipt" | "billing" | "expense" | null
  >(null);
  const [printMode, setPrintMode] = useState<"month" | "range" | "today">(
    "month",
  );
  const [printMonth, setPrintMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [printYear, setPrintYear] = useState<number>(currentYear);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPrintCustomer, setSelectedPrintCustomer] =
    useState<string>("all");
  const [printing, setPrinting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

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

  // Fetch customers when print modal opens
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!showPrintModal) return;

      try {
        const year =
          printMode === "today"
            ? new Date().getFullYear()
            : printMode === "range" && startDate
              ? new Date(startDate).getFullYear()
              : printYear;

        const month =
          printMode === "today"
            ? new Date().getMonth() + 1
            : printMode === "range" && startDate
              ? new Date(startDate).getMonth() + 1
              : printMonth;

        const response = await fetch(
          `/api/sale/customer/by-month?year=${year}&month=${month}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCustomers(result.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };

    fetchCustomers();
  }, [showPrintModal, printMode, printMonth, printYear, startDate]);

  // Helper for getting today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper for opening print tab(s)
  const handlePrint = async () => {
    setPrinting(true);

    let year = printYear;
    let month = printMonth;
    let dateParams = "";

    // Determine parameters based on print mode
    if (printMode === "today") {
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      const todayStr = getTodayString();
      dateParams = `&startDate=${todayStr}&endDate=${todayStr}`;
    } else if (printMode === "range" && startDate && endDate) {
      const start = new Date(startDate);
      year = start.getFullYear();
      month = start.getMonth() + 1;
      dateParams = `&startDate=${startDate}&endDate=${endDate}`;
    }

    if (printType === "invoice") {
      window.open(
        `/saledashboard2/${year}/${month}/report/${dateParams ? "?" + dateParams.substring(1) : ""}`,
        "_blank",
      );
      setPrinting(false);
    } else if (printType === "receipt" && customers.length > 0) {
      if (selectedPrintCustomer === "all") {
        // เปิดทีละ tab เพื่อไม่ให้โดน popup blocker
        for (let i = 0; i < customers.length; i++) {
          const c = customers[i];
          setTimeout(() => {
            const url = `/saledashboard2/${year}/${month}/receipt/?customerId=${c.id}&customerCode=${encodeURIComponent(c.code)}&customerName=${encodeURIComponent(c.name)}${dateParams}`;
            window.open(url, "_blank");

            // หยุด loading เมื่อเปิดครบแล้ว
            if (i === customers.length - 1) {
              setPrinting(false);
            }
          }, i * 300);
        }
      } else {
        const customer = customers.find(
          (c) => c.id.toString() === selectedPrintCustomer,
        );
        if (customer) {
          const url = `/saledashboard2/${year}/${month}/receipt/?customerId=${selectedPrintCustomer}&customerCode=${encodeURIComponent(customer.code)}&customerName=${encodeURIComponent(customer.name)}${dateParams}`;
          window.open(url, "_blank");
        }
        setPrinting(false);
      }
    } else if (printType === "billing" && customers.length > 0) {
      if (selectedPrintCustomer === "all") {
        // เปิดทีละ tab เพื่อไม่ให้โดน popup blocker
        for (let i = 0; i < customers.length; i++) {
          const c = customers[i];
          setTimeout(() => {
            const url = `/saledashboard2/${year}/${month}/billing/?customerId=${c.id}&customerCode=${encodeURIComponent(c.code)}&customerName=${encodeURIComponent(c.name)}${dateParams}`;
            window.open(url, "_blank");

            // หยุด loading เมื่อเปิดครบแล้ว
            if (i === customers.length - 1) {
              setPrinting(false);
            }
          }, i * 300);
        }
      } else {
        const customer = customers.find(
          (c) => c.id.toString() === selectedPrintCustomer,
        );
        if (customer) {
          const url = `/saledashboard2/${year}/${month}/billing/?customerId=${selectedPrintCustomer}&customerCode=${encodeURIComponent(customer.code)}&customerName=${encodeURIComponent(customer.name)}${dateParams}`;
          window.open(url, "_blank");
        }
        setPrinting(false);
      }
    } else if (printType === "expense") {
      window.open(
        `/saledashboard2/${year}/${month}/expense-report/${dateParams ? "?" + dateParams.substring(1) : ""}`,
        "_blank",
      );
      setPrinting(false);
    }

    // ปิด modal หลังจาก delay เล็กน้อย
    setTimeout(() => {
      setShowPrintModal(false);
      setPrintType(null);
      setPrintMode("month");
      setSelectedPrintCustomer("all");
      setStartDate("");
      setEndDate("");
    }, 500);
  };

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
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">ข้อมูลรายเดือน</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrintModal(true)}
            >
              <Printer className="h-4 w-4 mr-2" />
              พิมพ์รายงาน
            </Button>
          </div>
          <MonthlyDataTable data={monthlyData} year={selectedYear} />
        </div>

        {/* Print Modal */}
        <PrintReportModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPrintType(null);
            setPrintMode("month");
            setSelectedPrintCustomer("all");
            setStartDate("");
            setEndDate("");
          }}
          printType={printType}
          setPrintType={setPrintType}
          printMode={printMode}
          setPrintMode={setPrintMode}
          printMonth={printMonth}
          setPrintMonth={setPrintMonth}
          printYear={printYear}
          setPrintYear={setPrintYear}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedPrintCustomer={selectedPrintCustomer}
          setSelectedPrintCustomer={setSelectedPrintCustomer}
          customers={customers}
          printing={printing}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
}
