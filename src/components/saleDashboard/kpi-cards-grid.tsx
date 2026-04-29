"use client";

import { KPIStatCard } from "./kpi-stat-card";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Package,
  Award,
} from "lucide-react";

interface KPISummaryData {
  salesAmount: {
    total: number;
    formatted: string;
    totalWithAndWithoutInvoice: number;
    totalWithAndWithoutInvoiceFormatted: string;
  };
  salesQuantity: {
    total: number;
    formatted: string;
  };
  income: {
    total: number;
    formatted: string;
    totalWithAndWithoutInvoice: number;
    totalWithAndWithoutInvoiceFormatted: string;
    totalWithAndWithoutInvoiceAfterTax: number;
    totalWithAndWithoutInvoiceAfterTaxFormatted: string;
  };
  expense: {
    total: number;
    formatted: string;
    totalTax: number;
    totalTaxFormatted: string;
  };
  netProfit: {
    total: number;
    formatted: string;
    totalWithAndWithoutInvoice: number;
    totalWithAndWithoutInvoiceFormatted: string;
    percentage: number;
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
        subtitle={`ยอดขายทั้งหมด | (มี/ไม่มี Invoice) ฿${data.salesAmount.totalWithAndWithoutInvoice.toLocaleString()}`}
      />

      <KPIStatCard
        title="กำไรสุทธิ"
        value={data.netProfit.total}
        format="currency"
        variant="gradient-green"
        icon={TrendingUp}
        subtitle={`${data.netProfit.percentage}% จากรายได้ | (มี/ไม่มี Invoice) ฿${data.netProfit.totalWithAndWithoutInvoice.toLocaleString()}`}
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
        subtitle={`รายได้จากบิล (หักภาษีแล้ว) | (มี/ไม่มี Invoice) ฿${data.income.totalWithAndWithoutInvoiceAfterTax.toLocaleString()}`}
      />

      <KPIStatCard
        title="ค่าใช้จ่าย"
        value={data.expense.total}
        format="currency"
        variant="danger"
        icon={Package}
        subtitle={`รายจ่ายทั้งหมด | ยอดภาษี ${data.expense.totalTax.toLocaleString()}`}
      />

      {data.topCustomer && (
        <KPIStatCard
          title="ลูกค้าที่ซื้อมากที่สุด"
          value={data.topCustomer.name}
          format="text"
          variant="gradient-orange"
          icon={Award}
          subtitle={`${data.topCustomer.formatted.purchaseCount} ออเดอร์ • ${data.topCustomer.formatted.totalAmount}`}
        />
      )}
    </div>
  );
}
