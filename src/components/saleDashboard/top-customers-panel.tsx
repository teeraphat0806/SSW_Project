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
import {
  formatCurrency,
  formatNumber,
} from "@/lib/saleDashboard/analytics-utils";
import { useSaleAnalytics } from "@/hooks/saleDashboard/useSaleAnalytics";

interface TopCustomersPanelProps {
  year: number;
  month?: number;
  onCustomerClick?: (customerId: number) => void;
}

export function TopCustomersPanel({
  year,
  month,
  onCustomerClick,
}: TopCustomersPanelProps) {
  const { topCustomers, customerConcentration, loading, error } =
    useSaleAnalytics();

  const customers = useMemo(
    () => topCustomers(year, month),
    [year, month, topCustomers]
  );
  const concentration = useMemo(
    () => customerConcentration(year, month),
    [year, month, customerConcentration]
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">ลูกค้าชั้นนำ</h3>

      {/* Concentration Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Top 1 ลูกค้า</p>
          <p className="text-2xl font-bold">
            {concentration.top1Share.toFixed(1)}%
          </p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Top 3 ลูกค้า</p>
          <p className="text-2xl font-bold">
            {concentration.top3Share.toFixed(1)}%
          </p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Top 5 ลูกค้า</p>
          <p className="text-2xl font-bold">
            {concentration.top5Share.toFixed(1)}%
          </p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">
            ความเข้มข้น (HHI)
          </p>
          <p className="text-2xl font-bold">
            {concentration.herfindahlIndex.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {concentration.herfindahlIndex > 2500
              ? "สูง"
              : concentration.herfindahlIndex > 1500
              ? "ปานกลาง"
              : "ต่ำ"}
          </p>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>อันดับ</TableHead>
              <TableHead>ชื่อลูกค้า</TableHead>
              <TableHead className="text-right">ยอดขาย</TableHead>
              <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
              <TableHead className="text-right">ค่าเฉลี่ย/คำสั่งซื้อ</TableHead>
              <TableHead className="text-right">% ของยอดขายรวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.slice(0, 10).map((customer, index) => (
              <TableRow
                key={customer.customerId}
                className={
                  onCustomerClick ? "cursor-pointer hover:bg-muted/50" : ""
                }
                onClick={() => onCustomerClick?.(customer.customerId)}
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {customer.customerName}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(customer.totalSales)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(customer.orderCount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(customer.avgOrderValue)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{customer.shareOfTotal.toFixed(1)}%</span>
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.min(customer.shareOfTotal * 2, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
