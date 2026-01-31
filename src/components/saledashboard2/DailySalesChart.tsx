"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
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
import { Loader2 } from "lucide-react";

interface DailySalesData {
  day: number;
  date: string;
  salesAmt: number;
  salesQty: number;
  formatted: {
    salesAmt: string;
    salesQty: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: DailySalesData[];
  meta: {
    year: number;
    month: number;
    monthName: string;
    totalDays: number;
    totalSalesAmt: number;
    totalSalesQty: number;
  };
}

interface DailySalesChartProps {
  year: string;
  month: string;
}

type ViewMode = "amount" | "quantity";

export function DailySalesChart({ year, month }: DailySalesChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("amount");
  const [data, setData] = useState<DailySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/sale/daily-sales?year=${year}&month=${month}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch daily sales data");
        }

        const result: ApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
          setMeta(result.meta);
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching daily sales:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  // Create full month data (all days, even with 0 sales)
  const chartData =
    meta && data.length > 0
      ? Array.from({ length: meta.totalDays }, (_, i) => {
          const day = i + 1;
          const dayData = data.find((d) => d.day === day);
          return {
            day,
            dayLabel: `${day}`,
            value: dayData
              ? viewMode === "amount"
                ? dayData.salesAmt
                : dayData.salesQty
              : 0,
            formatted: dayData
              ? viewMode === "amount"
                ? dayData.formatted.salesAmt
                : dayData.formatted.salesQty
              : viewMode === "amount"
                ? "฿0"
                : "0",
          };
        })
      : [];

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const yAxisDomain = [0, Math.ceil(maxValue * 1.1)];

  if (loading) {
    return (
      <Card className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Title and Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            กราฟยอดขายรายวัน - {meta?.monthName} {parseInt(year) + 543}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            แสดงข้อมูล{viewMode === "amount" ? "มูลค่ายอดขาย" : "จำนวนบิล"}
            รายวันตลอดทั้งเดือน
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
              <SelectItem value="quantity">จำนวนบิล</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Card */}
      <Card className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={viewMode === "amount" ? "#3b82f6" : "#10b981"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={viewMode === "amount" ? "#3b82f6" : "#10b981"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e4e4e7"
              className="dark:stroke-zinc-800"
            />
            <XAxis
              dataKey="dayLabel"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={{ stroke: "#e4e4e7" }}
              className="dark:[&_line]:stroke-zinc-800"
              label={{
                value: "วันที่",
                position: "insideBottom",
                offset: -10,
                style: { fill: "#71717a", fontSize: 12 },
              }}
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
              cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
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
                  viewMode === "amount" ? "ยอดขาย" : "จำนวนบิล",
                ];
              }}
              labelFormatter={(day) =>
                `วันที่ ${day} ${meta?.monthName} ${parseInt(year) + 543}`
              }
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
              formatter={() =>
                viewMode === "amount" ? "ยอดขาย (฿)" : "จำนวนบิล"
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={viewMode === "amount" ? "#3b82f6" : "#10b981"}
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        {meta && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                ยอดขายรวมทั้งเดือน
              </p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                ฿{meta.totalSalesAmt.toLocaleString("en-US")}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                จำนวนบิลทั้งเดือน
              </p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">
                {meta.totalSalesQty} บิล
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
