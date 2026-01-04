import { Card } from "@/components/ui/card";
import {
  formatCurrency,
  formatNumber,
} from "@/lib/saleDashboard/analytics-utils";
import { LucideIcon } from "lucide-react";

interface KPIStatCardProps {
  title: string;
  value: number | string;
  format?: "currency" | "number" | "text" | "percentage";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorCode?: "profit" | "loss" | "neutral";
  variant?:
    | "default"
    | "primary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "gradient-blue"
    | "gradient-green"
    | "gradient-purple"
    | "gradient-orange";
  icon?: LucideIcon;
}

export function KPIStatCard({
  title,
  value,
  format = "text",
  subtitle,
  trend,
  colorCode,
  variant = "default",
  icon: Icon,
}: KPIStatCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value as number)
      : format === "number"
      ? formatNumber(value as number)
      : format === "percentage"
      ? `${(value as number).toFixed(1)}%`
      : value;

  // Variant styles
  const variantStyles = {
    default: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
    primary:
      "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800",
    success:
      "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800",
    danger:
      "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800",
    warning:
      "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800",
    info: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800",
    "gradient-blue":
      "bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-blue-600 text-white",
    "gradient-green":
      "bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-green-600 text-white",
    "gradient-purple":
      "bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 text-white",
    "gradient-orange":
      "bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 border-orange-600 text-white",
  };

  const iconColorStyles = {
    default: "text-zinc-400 dark:text-zinc-600",
    primary: "text-blue-500 dark:text-blue-400",
    success: "text-green-500 dark:text-green-400",
    danger: "text-red-500 dark:text-red-400",
    warning: "text-amber-500 dark:text-amber-400",
    info: "text-cyan-500 dark:text-cyan-400",
    "gradient-blue": "text-white/80",
    "gradient-green": "text-white/80",
    "gradient-purple": "text-white/80",
    "gradient-orange": "text-white/80",
  };

  const titleColorStyles = {
    default: "text-muted-foreground",
    primary: "text-blue-700 dark:text-blue-300",
    success: "text-green-700 dark:text-green-300",
    danger: "text-red-700 dark:text-red-300",
    warning: "text-amber-700 dark:text-amber-300",
    info: "text-cyan-700 dark:text-cyan-300",
    "gradient-blue": "text-white/90",
    "gradient-green": "text-white/90",
    "gradient-purple": "text-white/90",
    "gradient-orange": "text-white/90",
  };

  const isGradientVariant = variant.startsWith("gradient-");

  return (
    <Card
      className={`p-6 shadow-lg rounded-2xl border-2 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ${variantStyles[variant]}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${titleColorStyles[variant]}`}>
            {title}
          </p>
          {Icon && (
            <div
              className={`p-2 rounded-lg ${
                isGradientVariant
                  ? "bg-white/20"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${iconColorStyles[variant]}`} />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p
            className={`text-3xl font-bold tracking-tight ${
              isGradientVariant
                ? "text-white"
                : colorCode === "profit"
                ? "text-green-600 dark:text-green-400"
                : colorCode === "loss"
                ? "text-red-600 dark:text-red-400"
                : ""
            }`}
          >
            {formattedValue}
          </p>
          {trend && (
            <span
              className={`text-sm font-semibold ${
                isGradientVariant
                  ? trend.isPositive
                    ? "text-white/90"
                    : "text-white/90"
                  : trend.isPositive
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {trend.isPositive ? "↑ +" : "↓ "}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p
            className={`text-xs ${
              isGradientVariant ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}
