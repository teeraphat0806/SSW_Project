"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPIStatCard } from "./kpi-stat-card";
import { OrderDetailModal } from "./order-detail-modal";
import { PrintOptionsModal } from "./print-options-modal";
import {
  getMonthName,
  formatCurrency,
  formatDate,
  getMonthSalesData,
  getMonthCustomerBreakdown,
  getMonthOrders,
} from "@/lib/saleDashboard/analytics-utils";
import { Printer } from "lucide-react";

interface MonthDashboardPanelProps {
  year: number;
  initialMonth?: number;
}

type CustomerSortMode =
  | "orders-high"
  | "orders-low"
  | "sales-high"
  | "sales-low";
type OrderSortMode = "latest" | "oldest" | "total-high" | "total-low";

export function MonthDashboardPanel({
  year,
  initialMonth = 1,
}: MonthDashboardPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [customerSortMode, setCustomerSortMode] =
    useState<CustomerSortMode>("sales-high");
  const [orderSortMode, setOrderSortMode] = useState<OrderSortMode>("latest");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showPrintModal, setShowPrintModal] = useState(false);

  const monthSalesData = useMemo(
    () => getMonthSalesData(year, selectedMonth),
    [year, selectedMonth]
  );
  const monthCustomers = useMemo(
    () => getMonthCustomerBreakdown(year, selectedMonth),
    [year, selectedMonth]
  );
  const monthOrders = useMemo(
    () => getMonthOrders(year, selectedMonth),
    [year, selectedMonth]
  );

  const sortedCustomers = useMemo(() => {
    const data = [...monthCustomers];
    switch (customerSortMode) {
      case "orders-high":
        return data.sort((a, b) => b.orderCount - a.orderCount);
      case "orders-low":
        return data.sort((a, b) => a.orderCount - b.orderCount);
      case "sales-high":
        return data.sort((a, b) => b.totalSales - a.totalSales);
      case "sales-low":
        return data.sort((a, b) => a.totalSales - b.totalSales);
      default:
        return data;
    }
  }, [monthCustomers, customerSortMode]);

  const filteredAndSortedOrders = useMemo(() => {
    let data = [...monthOrders];

    if (statusFilter !== "all") {
      data = data.filter((order) => order.status === statusFilter);
    }

    switch (orderSortMode) {
      case "latest":
        return data.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      case "oldest":
        return data.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      case "total-high":
        return data.sort((a, b) => b.total - a.total);
      case "total-low":
        return data.sort((a, b) => a.total - b.total);
      default:
        return data;
    }
  }, [monthOrders, statusFilter, orderSortMode]);

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "รอดำเนินการ",
      in_progress: "กำลังดำเนินการ",
      completed: "เสร็จสมบูรณ์",
      cancelled: "ยกเลิก",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">
          รายละเอียดเดือน {getMonthName(selectedMonth)} {year}
        </h2>
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกเดือน" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {getMonthName(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrint}
            className="print:hidden bg-transparent"
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="ยอดขายเดือนนี้"
          value={monthSalesData.totalSales}
          format="currency"
        />
        <KPIStatCard
          title="คำสั่งซื้อทั้งหมด"
          value={monthSalesData.totalOrders}
          format="number"
        />
        <KPIStatCard
          title="ยอดเฉลี่ยต่อคำสั่งซื้อ"
          value={monthSalesData.avgOrderValue}
          format="currency"
        />
        <KPIStatCard
          title="สถานะ"
          value={monthSalesData.completedOrders}
          format="number"
          subtitle={`เสร็จสิ้น: ${monthSalesData.completedOrders} | รอ: ${monthSalesData.pendingOrders}`}
        />
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">ยอดขายตามลูกค้า</h3>
          <Select
            value={customerSortMode}
            onValueChange={(v) => setCustomerSortMode(v as CustomerSortMode)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales-high">ยอดขาย: สูง → ต่ำ</SelectItem>
              <SelectItem value="sales-low">ยอดขาย: ต่ำ → สูง</SelectItem>
              <SelectItem value="orders-high">
                คำสั่งซื้อ: มาก → น้อย
              </SelectItem>
              <SelectItem value="orders-low">คำสั่งซื้อ: น้อย → มาก</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="text-right">คำสั่งซื้อ</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">ยอดเฉลี่ย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    ไม่มีข้อมูลในเดือนนี้
                  </TableCell>
                </TableRow>
              ) : (
                sortedCustomers.map((customer) => (
                  <TableRow key={customer.customerId}>
                    <TableCell className="font-medium">
                      {customer.customerName}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(customer.totalSales)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(customer.avgOrderValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold">
            คำสั่งซื้อทั้งหมด ({filteredAndSortedOrders.length})
          </h3>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="completed">เสร็จสมบูรณ์</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={orderSortMode}
              onValueChange={(v) => setOrderSortMode(v as OrderSortMode)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">ล่าสุด → เก่าสุด</SelectItem>
                <SelectItem value="oldest">เก่าสุด → ล่าสุด</SelectItem>
                <SelectItem value="total-high">ยอด: สูง → ต่ำ</SelectItem>
                <SelectItem value="total-low">ยอด: ต่ำ → สูง</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่ PO</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-center">ดูรายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    ไม่มีคำสั่งซื้อในเดือนนี้
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-mono">
                      {order.poNumber}
                    </TableCell>
                    <TableCell>{order.customerName || "-"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted">
                        {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        ดู
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
      <PrintOptionsModal
        open={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        year={year}
        defaultMonth={selectedMonth}
      />
    </div>
  );
}
