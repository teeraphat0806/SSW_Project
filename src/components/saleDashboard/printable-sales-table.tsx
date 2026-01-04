"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  formatCurrency,
  type MonthlySalesData,
} from "@/lib/saleDashboard/analytics-utils";

interface PrintableSalesTableProps {
  year: number;
  data: MonthlySalesData[];
}

export function PrintableSalesTable({ year, data }: PrintableSalesTableProps) {
  const handlePrint = () => {
    window.print();
  };

  // Convert AD year to Buddhist Era (BE) for display
  const buddhistYear = year + 543;

  const totals = data.reduce(
    (acc, month) => ({
      sales: acc.sales + month.totalSales,
      orders: acc.orders + month.totalOrders,
      vat: acc.vat + month.totalVAT,
      discount: acc.discount + month.totalDiscount,
    }),
    { sales: 0, orders: 0, vat: 0, discount: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h3 className="text-lg font-semibold">
          รายงานยอดขายรายเดือน {buddhistYear}
        </h3>
        <Button onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" />
          พิมพ์รายงาน
        </Button>
      </div>

      <div id="printable-area" className="print:p-8">
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-center">
            รายงานยอดขายรายเดือน
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            ปี {buddhistYear}
          </p>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">เดือน</TableHead>
                <TableHead className="text-right">ยอดขาย</TableHead>
                <TableHead className="text-right">จำนวนคำสั่งซื้อ</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">ส่วนลด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((month) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">
                    {month.monthName}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {month.totalOrders}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.totalVAT)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(month.totalDiscount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted">
                <TableCell>รวมทั้งหมด</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.sales)}
                </TableCell>
                <TableCell className="text-right">{totals.orders}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.vat)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.discount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="hidden print:block mt-8 text-sm text-muted-foreground">
          <p>พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH")}</p>
        </div>
      </div>
    </div>
  );
}
