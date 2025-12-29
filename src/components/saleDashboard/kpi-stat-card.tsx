import { Card } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/saleDashboard/analytics-utils"

interface KPIStatCardProps {
  title: string
  value: number | string
  format?: "currency" | "number" | "text" | "percentage"
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KPIStatCard({ title, value, format = "text", subtitle, trend }: KPIStatCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value as number)
      : format === "number"
        ? formatNumber(value as number)
        : format === "percentage"
          ? `${(value as number).toFixed(1)}%`
          : value

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tracking-tight">{formattedValue}</p>
          {trend && (
            <span className={`text-sm ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </Card>
  )
}
