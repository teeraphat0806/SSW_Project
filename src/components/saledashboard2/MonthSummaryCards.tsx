import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Percent,
  Award,
} from "lucide-react";
import { KPIStatCard } from "../../components/saleDashboard/kpi-stat-card";
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
  topCustomer?: {
    id: number;
    name: string;
    taxNumber: string;
    purchaseCount: number;
    totalAmount: number;
    formatted: {
      purchaseCount: string;
      totalAmount: string;
    };
  } | null;
}

interface MonthSummaryCardsProps {
  data: MonthSummaryData;
}

export function MonthSummaryCards({ data }: MonthSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Income Card */}
      <KPIStatCard
        title="รายได้รวม"
        value={data.income.total}
        format="currency"
        variant="gradient-green"
        icon={DollarSign}
        subtitle={`จากบิลทั้งหมด ${data.income.billCount.toLocaleString()} รายการ | เฉลี่ย ฿${data.income.avgPerBill.toLocaleString()} ต่อบิล`}
      />

      {/* Total Expense Card */}
      <KPIStatCard
        title="รายจ่ายรวม"
        value={data.expense.total}
        format="currency"
        variant="gradient-orange"
        icon={CreditCard}
        subtitle={`จากรายการทั้งหมด ${data.expense.itemCount.toLocaleString()} รายการ | เฉลี่ย ฿${data.expense.avgPerItem.toLocaleString()} ต่อรายการ`}
      />

      {/* Net Total Card */}
      <KPIStatCard
        title="กำไรสุทธิ"
        value={data.net.total}
        format="currency"
        variant={data.net.total >= 0 ? "gradient-blue" : "danger"}
        icon={data.net.total >= 0 ? TrendingUp : TrendingDown}
        colorCode={data.net.total >= 0 ? "profit" : "loss"}
        subtitle={`${data.net.total >= 0 ? "กำไร" : "ขาดทุน"} ${Math.abs(data.net.percentage)}% | อัตรากำไร ${data.net.profitMargin.toFixed(1)}%`}
      />

      {/* Bill Count Card */}
      <KPIStatCard
        title="จำนวนบิล"
        value={data.income.billCount}
        format="number"
        variant="gradient-purple"
        icon={ShoppingCart}
        subtitle="รายการขาย"
      />

      {/* Expense Count Card */}
      <KPIStatCard
        title="จำนวนรายจ่าย"
        value={data.expense.itemCount}
        format="number"
        variant="warning"
        icon={CreditCard}
        subtitle="รายการค่าใช้จ่าย"
      />

      {/* Top Customer Card */}
      {data.topCustomer && (
        <KPIStatCard
          title="ลูกค้ายอดซื้อสูงสุด"
          value={data.topCustomer.name}
          format="text"
          variant="gradient-red"
          icon={Award}
          subtitle={`${data.topCustomer.formatted.purchaseCount} ออเดอร์ • ${data.topCustomer.formatted.totalAmount}`}
        />
      )}
    </div>
  );
}
