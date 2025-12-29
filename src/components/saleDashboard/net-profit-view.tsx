"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  getNetProfitByMonth,
  getNetProfitSummary,
  generateProfitInsight,
  formatCurrency,
} from "@/lib/saleDashboard/analytics-utils";
import { KPIStatCard } from "./kpi-stat-card";

interface NetProfitViewProps {
  year: number;
}

export function NetProfitView({ year }: NetProfitViewProps) {
  const monthlyData = useMemo(() => getNetProfitByMonth(year), [year]);
  const summary = useMemo(() => getNetProfitSummary(year), [year]);
  const insight = useMemo(() => generateProfitInsight(year), [year]);

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="กำไรสุทธิ"
          value={summary.yearlyNetProfit}
          format="currency"
          subtitle={summary.profitMargin >= 0 ? "กำไร" : "ขาดทุน"}
        />
        <KPIStatCard
          title="อัตรากำไรสุทธิ"
          value={summary.profitMargin}
          format="number"
          subtitle="%"
        />
        <KPIStatCard
          title="การเปลี่ยนแปลง MoM"
          value={summary.momChange || 0}
          format="number"
          subtitle={
            summary.momChange !== undefined
              ? `${
                  summary.momChange >= 0 ? "+" : ""
                }${summary.momChange.toFixed(1)}%`
              : "-"
          }
        />
        <KPIStatCard
          title="การเปลี่ยนแปลง YoY"
          value={summary.yoyChange || 0}
          format="number"
          subtitle={
            summary.yoyChange !== undefined
              ? `${
                  summary.yoyChange >= 0 ? "+" : ""
                }${summary.yoyChange.toFixed(1)}%`
              : "-"
          }
        />
      </div>

      {/* Insight Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          {summary.profitMargin >= 0 ? (
            <TrendingUp className="h-8 w-8 text-green-600" />
          ) : (
            <TrendingDown className="h-8 w-8 text-red-600" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">ข้อมูลเชิงลึก</p>
            <p className="text-lg font-semibold">{insight}</p>
          </div>
        </div>
      </Card>

      {/* Monthly Trend Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">แนวโน้มกำไรสุทธิรายเดือน</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เดือน</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">ค่าใช้จ่าย</TableHead>
                <TableHead className="text-right">เงินเดือน</TableHead>
                <TableHead className="text-right">กำไรสุทธิ</TableHead>
                <TableHead className="text-right">อัตรากำไร</TableHead>
                <TableHead className="text-right">แนวโน้ม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((month) => {
                const maxProfit = Math.max(
                  ...monthlyData.map((m) => Math.abs(m.netProfit))
                );
                const trendWidth =
                  maxProfit > 0
                    ? (Math.abs(month.netProfit) / maxProfit) * 100
                    : 0;

                return (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">
                      {month.monthName}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.sales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.expenses)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(month.salaries)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          month.netProfit >= 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {formatCurrency(month.netProfit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          month.profitMargin >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {month.profitMargin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="w-24 h-6 bg-muted rounded-full overflow-hidden ml-auto">
                        <div
                          className={`h-full ${
                            month.netProfit >= 0 ? "bg-green-500" : "bg-red-500"
                          }`}
                          style={{ width: `${trendWidth}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
