"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  ShoppingCart,
  Package,
} from "lucide-react";

// Dynamic import for chart to avoid hydration issues
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), {
  ssr: false,
});

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
  const [isClient, setIsClient] = useState(false);
  const { yearlySales, orderStatusByYear, monthlySalesByYear, loading, error } =
    useSaleAnalytics();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sales = useMemo(() => yearlySales(year), [year, yearlySales]);
  const orderStatus = useMemo(
    () => orderStatusByYear(year),
    [year, orderStatusByYear]
  );
  const monthlyData = useMemo(
    () => monthlySalesByYear(year),
    [year, monthlySalesByYear]
  );

  // Calculate actual totals from monthly sales data (from bills only, excludes OT and other income)
  const yearlyRevenue = useMemo(() => {
    const totalSales = monthlyData.reduce((sum, m) => sum + m.totalSales, 0);
    const totalOrders = monthlyData.reduce((sum, m) => sum + m.totalOrders, 0);
    const totalVAT = monthlyData.reduce((sum, m) => sum + m.totalVAT, 0);
    const totalDiscount = monthlyData.reduce(
      (sum, m) => sum + m.totalDiscount,
      0
    );

    return {
      totalSales,
      totalOrders,
      totalVAT,
      totalDiscount,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
    };
  }, [monthlyData]);

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
  // Convert AD year to Buddhist Era (BE) for display
  const buddhistYear = year + 543;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ภาพรวมทั้งปี {buddhistYear}</h2>
      </div>

      {/* Year KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="รายได้รวม (ยอดขายทั้งปี)"
          value={yearlyRevenue.totalSales}
          format="currency"
          variant="gradient-blue"
          icon={DollarSign}
        />
        <KPIStatCard
          title="VAT รวม"
          value={yearlyRevenue.totalVAT}
          format="currency"
          variant="gradient-green"
          icon={Receipt}
        />
        <KPIStatCard
          title="ยอดเฉลี่ยต่อคำสั่งซื้อ"
          value={yearlyRevenue.averageOrderValue}
          format="currency"
          variant="gradient-purple"
          icon={ShoppingCart}
        />
        <KPIStatCard
          title="คำสั่งซื้อทั้งหมด"
          value={yearlyRevenue.totalOrders}
          format="number"
          subtitle={`เสร็จสิ้น: ${completedOrders} | รอดำเนินการ: ${pendingOrders}`}
          variant="gradient-orange"
          icon={Package}
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

        {/* Monthly Sales Chart - Histogram */}
        <div className="w-full">
          {isClient && sortedMonthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={sortedMonthlyData.map((month) => ({
                  month: month.monthName,
                  ยอดขาย: month.totalSales,
                  จำนวนคำสั่ง: month.totalOrders,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: "ยอดขาย",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="ยอดขาย"
                  fill="#3b82f6"
                  name="ยอดขายรายเดือน"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground">ไม่พบข้อมูลยอดขาย</p>
            </div>
          )}
        </div>

        {/* Visual bars for mobile */}
        <div className="space-y-2 md:hidden mt-6">
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
