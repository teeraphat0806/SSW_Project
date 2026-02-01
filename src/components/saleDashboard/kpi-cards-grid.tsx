"use client";

import { KPIStatCard } from "./kpi-stat-card";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Package,
} from "lucide-react";

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

interface KPICardsGridProps {
  data: KPISummaryData;
}

export function KPICardsGrid({ data }: KPICardsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPIStatCard
        title="ยอดขายรวม"
        value={data.salesAmount.total}
        format="currency"
        variant="gradient-blue"
        icon={DollarSign}
        subtitle="ยอดขายทั้งหมด"
      />

      <KPIStatCard
        title="กำไรสุทธิ"
        value={data.netProfit.total}
        format="currency"
        variant="gradient-green"
        icon={TrendingUp}
        subtitle={`${data.netProfit.percentage}% จากรายได้`}
      />

      <KPIStatCard
        title="จำนวนออร์เดอร์"
        value={data.salesQuantity.total}
        format="number"
        variant="gradient-purple"
        icon={ShoppingCart}
        subtitle="ออร์เดอร์ที่สำเร็จ"
      />

      <KPIStatCard
        title="รายได้รวม"
        value={data.income.total}
        format="currency"
        variant="success"
        icon={CreditCard}
        subtitle="รายได้จากบิล"
      />

      <KPIStatCard
        title="ค่าใช้จ่าย"
        value={data.expense.total}
        format="currency"
        variant="danger"
        icon={Package}
        subtitle="รายจ่ายทั้งหมด"
      />

      <KPIStatCard
        title="อัตรากำไร"
        value={data.netProfit.percentage}
        format="percentage"
        variant="info"
        icon={TrendingUp}
        subtitle="Profit Margin"
      />
    </div>
  );
}
