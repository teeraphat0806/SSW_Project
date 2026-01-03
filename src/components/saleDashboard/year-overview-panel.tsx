"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPIStatCard } from "./kpi-stat-card";
import { formatCurrency } from "@/lib/saleDashboard/analytics-utils";
import { useSaleAnalytics } from "@/hooks/saleDashboard/useSaleAnalytics";
import { TrendingUp, TrendingDown } from "lucide-react";

interface YearOverviewPanelProps {
  year: number;
  onMonthSelect?: (month: number) => void;
}

type SortMode = "month" | "sales-high" | "sales-low";

export function YearOverviewPanel({
  year,
  onMonthSelect,
}: YearOverviewPanelProps) {
  const [sortMode, setSortMode] = useState<SortMode>("month");
  const { yearlySales, orderStatusByYear, monthlySalesByYear, loading, error } =
    useSaleAnalytics();

  const sales = useMemo(() => yearlySales(year), [year, yearlySales]);
  const orderStatus = useMemo(
    () => orderStatusByYear(year),
    [year, orderStatusByYear]
  );
  const monthlyData = useMemo(
    () => monthlySalesByYear(year),
    [year, monthlySalesByYear]
  );

  const completedOrders =
    orderStatus.find((s) => s.status === "เสร็จสมบูรณ์")?.count || 0;
  const pendingOrders =
    orderStatus.find((s) => s.status === "รอดำเนินการ")?.count || 0;

  const sortedMonthlyData = useMemo(() => {
    const data = [...monthlyData];
    switch (sortMode) {
      case "sales-high":
        return data.sort((a, b) => b.totalSales - a.totalSales);
      case "sales-low":
        return data.sort((a, b) => a.totalSales - b.totalSales);
      default:
        return data.sort((a, b) => a.month - b.month);
    }
  }, [monthlyData, sortMode]);

  const maxSales = Math.max(...monthlyData.map((m) => m.totalSales), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ภาพรวมทั้งปี {year}</h2>
      </div>

      {/* Year KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="ยอดขายรวมทั้งปี"
          value={sales.totalSales}
          format="currency"
        />
        <KPIStatCard title="VAT รวม" value={sales.totalVAT} format="currency" />
        <KPIStatCard
          title="ยอดเฉลี่ยต่อคำสั่งซื้อ"
          value={sales.averageOrderValue}
          format="currency"
        />
        <KPIStatCard
          title="คำสั่งซื้อทั้งหมด"
          value={sales.totalOrders}
          format="number"
          subtitle={`เสร็จสิ้น: ${completedOrders} | รอดำเนินการ: ${pendingOrders}`}
        />
      </div>

      {/* Order Status Breakdown */}
      <Card className="p-6 shadow-[10px_10px_20px_rgba(0,0,0,0.1)] rounded-2xl border-2 border-transparent hover:border-primary transition-colors">
        <h3 className="text-lg font-semibold mb-4">สถานะคำสั่งซื้อ</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {orderStatus.map((status) => (
            <div key={status.status} className="text-center">
              <p className="text-2xl font-bold">{status.count}</p>
              <p className="text-sm text-muted-foreground">{status.status}</p>
              <p className="text-xs text-muted-foreground">
                {status.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Sales Overview */}
      <Card className="p-6 shadow-[5px_5px_10px_rgba(0,0,0,0.1)] rounded-2xl border-2 border-transparent hover:border-primary transition-colors">
        <div className="flex items-center justify-between mb-4 ">
          <h3 className="text-lg font-semibold">ยอดขายรายเดือน</h3>
          <div className="flex gap-2">
            <Button
              variant={sortMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("month")}
            >
              เดือน
            </Button>
            <Button
              variant={sortMode === "sales-high" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("sales-high")}
            >
              <TrendingDown className="w-4 h-4 mr-1" />
              สูง-ต่ำ
            </Button>
            <Button
              variant={sortMode === "sales-low" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortMode("sales-low")}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              ต่ำ-สูง
            </Button>
          </div>
        </div>

        {/* Visual bars for mobile */}
        <div className="space-y-2 md:hidden">
          {sortedMonthlyData.map((month) => (
            <div
              key={month.month}
              className="space-y-1 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
              onClick={() => onMonthSelect?.(month.month)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{month.monthName}</span>
                <span className="text-sm text-muted-foreground">
                  {month.totalOrders} คำสั่งซื้อ
                </span>
              </div>
              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-primary h-full flex items-center justify-end px-2 text-primary-foreground text-xs font-medium"
                  style={{
                    width: `${Math.max(
                      (month.totalSales / maxSales) * 100,
                      3
                    )}%`,
                  }}
                >
                  {month.totalSales > 0 && formatCurrency(month.totalSales)}
                </div>
              </div>
              {onMonthSelect && (
                <p className="text-xs text-muted-foreground">
                  คลิกเพื่อดูรายละเอียด →
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Table for desktop */}
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <Table className=" rounded-2xl border-2 border-transparent hover:border-primary transition-colors">
            <TableHeader>
              <TableRow>
                <TableHead>เดือน</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">คำสั่งซื้อ</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-center">กราฟ</TableHead>
                {onMonthSelect && (
                  <TableHead className="text-center">ดูรายละเอียด</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMonthlyData.map((month) => (
                <TableRow key={month.month} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {month.monthName}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(month.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {month.totalOrders}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(month.totalVAT)}
                  </TableCell>
                  <TableCell>
                    <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden min-w-[100px]">
                      <div
                        className="bg-primary h-full"
                        style={{
                          width: `${Math.max(
                            (month.totalSales / maxSales) * 100,
                            2
                          )}%`,
                        }}
                      />
                    </div>
                  </TableCell>
                  {onMonthSelect && (
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMonthSelect(month.month)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
