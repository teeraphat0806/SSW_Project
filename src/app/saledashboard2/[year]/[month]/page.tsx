"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { MonthSummaryCards } from "@/components/saledashboard2/MonthSummaryCards";
import { CustomerSalesTable } from "@/components/saledashboard2/CustomerSalesTable";
import { ExpensesTable } from "@/components/saledashboard2/ExpensesTable";
import { DailySalesChart } from "@/components/saledashboard2/DailySalesChart";
import { Loader2 } from "lucide-react";
const MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

interface MonthSummaryData {
  month: number;
  monthName: string;
  year: number;
  income: {
    total: number;
    formatted: string;
    billCount: number;
    avgPerBill: number;
  };
  expense: {
    total: number;
    formatted: string;
    itemCount: number;
    avgPerItem: number;
  };
  net: {
    total: number;
    formatted: string;
    percentage: number;
    profitMargin: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: MonthSummaryData;
  meta: {
    totalDays: number;
    workingDays: number;
    lastUpdated: string;
  };
}

export default function MonthDetailPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const month = params.month as string;

  const [data, setData] = useState<MonthSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthName = MONTH_NAMES[parseInt(month) - 1];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/sale/month-summary?year=${year}&month=${month}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result: ApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-8 mt-10 md:mt-0 lg:mt-0">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/saledashboard2")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">
              รายละเอียด {monthName} {parseInt(year) + 543}
            </h1>
            <p className="text-muted-foreground mt-1">
              ข้อมูลรายละเอียดของเดือน {monthName} {parseInt(year) + 543}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="max-w-full flex flex-col items-center justify-center min-h-screen">
              <Loader2 className="mr-2 h-12 w-12 animate-spin" />
              <p className="text-lg mt-4 ">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">เกิดข้อผิดพลาด: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        {!loading && !error && data && <MonthSummaryCards data={data} />}

        {/* Daily Sales Chart */}
        {!loading && !error && <DailySalesChart year={year} month={month} />}

        {/* Tables Section */}
        {!loading && !error && (
          <div className="space-y-8">
            {/* Customer Sales Table */}
            <CustomerSalesTable year={year} month={month} />

            {/* Expenses Table */}
            <ExpensesTable year={year} month={month} />
          </div>
        )}
      </div>
    </div>
  );
}
