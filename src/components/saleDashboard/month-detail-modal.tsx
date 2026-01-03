"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
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
import {
  getOrdersForMonth,
  getCustomerBreakdownForMonth,
  formatCurrency,
  formatDate,
  getMonthName,
  type OrderSortType,
} from "@/lib/saleDashboard/analytics-utils";
import { OrderDetailModal } from "./order-detail-modal";
import { type Customer } from "@/types/customer";

interface MonthDetailModalProps {
  year: number;
  month: number | null;
  customers: Customer[];
  onClose: () => void;
}

export function MonthDetailModal({
  year,
  month,
  customers,
  onClose,
}: MonthDetailModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined);
  const [sortType, setSortType] = useState<OrderSortType>("latest");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const monthOrders = useMemo(() => {
    if (!month) return null;
    return getOrdersForMonth(year, month, selectedCustomerId, sortType);
  }, [year, month, selectedCustomerId, sortType]);

  const customerBreakdown = useMemo(() => {
    if (!month) return [];
    return getCustomerBreakdownForMonth(year, month);
  }, [year, month]);

  const [customerSortBy, setCustomerSortBy] = useState<
    "sales-desc" | "sales-asc" | "count-desc" | "count-asc"
  >("sales-desc");

  const sortedCustomerBreakdown = useMemo(() => {
    const sorted = [...customerBreakdown];
    switch (customerSortBy) {
      case "sales-asc":
        return sorted.sort((a, b) => a.totalSales - b.totalSales);
      case "sales-desc":
        return sorted.sort((a, b) => b.totalSales - a.totalSales);
      case "count-asc":
        return sorted.sort((a, b) => a.orderCount - b.orderCount);
      case "count-desc":
        return sorted.sort((a, b) => b.orderCount - a.orderCount);
      default:
        return sorted;
    }
  }, [customerBreakdown, customerSortBy]);

  if (!month || !monthOrders) return null;

  return (
    <>
      <Dialog open={month !== null} onOpenChange={onClose}>
        <DialogContent
          className="
    w-[96vw]
    h-[92vh]
    sm:max-w-[90vw]
    md:max-w-[1200px]
    lg:max-w-[1400px]
    xl:max-w-[1600px]
    p-6
    overflow-y-auto
    rounded-2xl
  "
        >
          <DialogHeader>
            <DialogTitle>
              รายละเอียดคำสั่งซื้อ - {getMonthName(month)} {year}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">ยอดขายรวม</p>
                <p className="text-xl font-bold">
                  {formatCurrency(monthOrders.totalSales)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  จำนวนคำสั่งซื้อ
                </p>
                <p className="text-xl font-bold">{monthOrders.orderCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  ค่าเฉลี่ย/คำสั่งซื้อ
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(monthOrders.avgOrderValue)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-1">สถานะ</p>
                <p className="text-sm">
                  เสร็จสิ้น: {monthOrders.completedCount} | รอดำเนินการ:{" "}
                  {monthOrders.pendingCount}
                </p>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  กรองตามลูกค้า
                </label>
                <Select
                  value={selectedCustomerId?.toString() || "all"}
                  onValueChange={(value) =>
                    setSelectedCustomerId(
                      value === "all" ? undefined : Number.parseInt(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ลูกค้าทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ลูกค้าทั้งหมด</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  เรียงตาม
                </label>
                <Select
                  value={sortType}
                  onValueChange={(value) => setSortType(value as OrderSortType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">ล่าสุดก่อน</SelectItem>
                    <SelectItem value="oldest">เก่าสุดก่อน</SelectItem>
                    <SelectItem value="sales-desc">
                      ยอดขาย (มาก → น้อย)
                    </SelectItem>
                    <SelectItem value="sales-asc">
                      ยอดขาย (น้อย → มาก)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders Table */}
            <div>
              <h4 className="font-semibold mb-3">รายการคำสั่งซื้อ</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่ PO</TableHead>
                      <TableHead>ลูกค้า</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">ยอดรวม</TableHead>
                      <TableHead>สร้างเมื่อ</TableHead>
                      <TableHead>เสร็จสิ้นเมื่อ</TableHead>
                      <TableHead>เลขที่ใบแจ้งหนี้</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthOrders.orders.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          ไม่พบคำสั่งซื้อ
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthOrders.orders.map((order) => {
                        const statusLabels: { [key: string]: string } = {
                          pending: "รอดำเนินการ",
                          cutting: "กำลังตัด",
                          weighing: "กำลังชั่ง",
                          ready: "พร้อมจัดส่ง",
                          shipped: "จัดส่งแล้ว",
                        };

                        return (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <TableCell className="font-medium">
                              {order.poNumber}
                            </TableCell>
                            <TableCell>{order.customerName || "-"}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === "shipped"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : order.status === "ready"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {statusLabels[order.status]}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(order.total)}
                            </TableCell>
                            <TableCell>
                              {formatDate(new Date(order.createdAt))}
                            </TableCell>
                            <TableCell>
                              {order.completedAt
                                ? formatDate(new Date(order.completedAt))
                                : "-"}
                            </TableCell>
                            <TableCell>{order.billInvoiceNo || "-"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Customer Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">สรุปตามลูกค้าในเดือนนี้</h4>
                <Select
                  value={customerSortBy}
                  onValueChange={(value: any) => setCustomerSortBy(value)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales-desc">
                      ยอดขาย (มาก → น้อย)
                    </SelectItem>
                    <SelectItem value="sales-asc">
                      ยอดขาย (น้อย → มาก)
                    </SelectItem>
                    <SelectItem value="count-desc">
                      จำนวนคำสั่งซื้อ (มาก → น้อย)
                    </SelectItem>
                    <SelectItem value="count-asc">
                      จำนวนคำสั่งซื้อ (น้อย → มาก)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อลูกค้า</TableHead>
                      <TableHead className="text-right">
                        จำนวนคำสั่งซื้อ
                      </TableHead>
                      <TableHead className="text-right">ยอดขาย</TableHead>
                      <TableHead className="text-right">
                        ค่าเฉลี่ย/คำสั่งซื้อ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCustomerBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-4"
                        >
                          ไม่พบข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedCustomerBreakdown.map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell className="font-medium">
                            {customer.customerName}
                          </TableCell>
                          <TableCell className="text-right">
                            {customer.orderCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(customer.totalSales)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(customer.avgOrder)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </>
  );
}
