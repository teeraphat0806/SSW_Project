"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

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

interface SalesBarChartProps {
  data: MonthlyDataItem[];
  year: number;
}

type ViewMode = "amount" | "quantity";

export function SalesBarChart({ data, year }: SalesBarChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("amount");

  const chartData = data.map((item) => ({
    month: item.monthName,
    value: viewMode === "amount" ? item.salesAmt : item.salesQty,
    formatted:
      viewMode === "amount" ? item.formatted.salesAmt : item.formatted.salesQty,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)];

  return (
    <div className="space-y-4">
      {/* Header with Title and Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            กราฟยอดขายประจำปี {year + 543}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            แสดงข้อมูล{viewMode === "amount" ? "มูลค่ายอดขาย" : "จำนวนออเดอร์"}
            ทั้ง 12 เดือน
          </p>
        </div>

        <div className="w-48">
          <Select
            value={viewMode}
            onValueChange={(value: ViewMode) => setViewMode(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amount">จำนวนเงิน (฿)</SelectItem>
              <SelectItem value="quantity">จำนวนออเดอร์</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Card */}
      <Card className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e4e4e7"
              className="dark:stroke-zinc-800"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={{ stroke: "#e4e4e7" }}
              className="dark:[&_line]:stroke-zinc-800"
            />
            <YAxis
              domain={yAxisDomain}
              tick={{ fill: "#71717a", fontSize: 12 }}
              axisLine={{ stroke: "#e4e4e7" }}
              className="dark:[&_line]:stroke-zinc-800"
              tickFormatter={(value) => {
                if (viewMode === "amount") {
                  if (value === 0) return "฿0";
                  if (value >= 1000000) {
                    return `฿${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `฿${(value / 1000).toFixed(0)}K`;
                  }
                  return `฿${value}`;
                }
                return value.toString();
              }}
            />
            <Tooltip
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{
                color: "#18181b",
                fontWeight: "600",
                marginBottom: "4px",
              }}
              formatter={(value: any, name: any, props: any) => {
                return [
                  props.payload.formatted,
                  viewMode === "amount" ? "ยอดขาย" : "จำนวนออเดอร์",
                ];
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              formatter={() =>
                viewMode === "amount" ? "ยอดขาย (฿)" : "จำนวนออเดอร์"
              }
            />
            <Bar
              dataKey="value"
              fill={viewMode === "amount" ? "#3b82f6" : "#10b981"}
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
