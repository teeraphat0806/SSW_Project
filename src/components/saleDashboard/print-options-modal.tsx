"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, Eye } from "lucide-react";
import { getMonthName } from "@/lib/saleDashboard/analytics-utils";
import { type Customer } from "@/types/customer";

interface PrintOptionsModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  defaultMonth?: number;
  customers: Customer[];
}

type ReportType = "monthly" | "yearly";
type SortOrder = "date-asc" | "date-desc" | "sales-asc" | "sales-desc";

export function PrintOptionsModal({
  open,
  onClose,
  year,
  defaultMonth = 1,
  customers,
}: PrintOptionsModalProps) {
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [customerId, setCustomerId] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [error, setError] = useState<string>("");

  const handlePreview = () => {
    setError("");

    if (reportType === "monthly" && !selectedMonth) {
      setError("กรุณาเลือกเดือน");
      return;
    }

    const params = new URLSearchParams({
      year: year.toString(),
      type: reportType,
      ...(reportType === "monthly" && { month: selectedMonth.toString() }),
      customer: customerId,
      sort: sortOrder,
      preview: "true",
    });

    window.open(`/saleDashboard/print/sales?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    setError("");

    if (reportType === "monthly" && !selectedMonth) {
      setError("กรุณาเลือกเดือน");
      return;
    }

    const params = new URLSearchParams({
      year: year.toString(),
      type: reportType,
      ...(reportType === "monthly" && { month: selectedMonth.toString() }),
      customer: customerId,
      sort: sortOrder,
    });

    window.open(`/saleDashboard/print/sales?${params.toString()}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ตั้งค่ารายงานการขาย</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div className="space-y-3">
            <Label>ประเภทรายงาน</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(v) => setReportType(v as ReportType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  รายงานรายเดือน (เลือกเดือน)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly" className="font-normal cursor-pointer">
                  รายงานทั้งปี (ครบทุกเดือน)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Month Selection (only for monthly report) */}
          {reportType === "monthly" && (
            <div className="space-y-2">
              <Label htmlFor="month">เลือกเดือน</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}
              >
                <SelectTrigger id="month">
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
            </div>
          )}

          {/* Customer Filter */}
          <div className="space-y-2">
            <Label htmlFor="customer">กรองตามลูกค้า</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ลูกค้าทั้งหมด</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="sort">เรียงลำดับ</Label>
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as SortOrder)}
            >
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">
                  วันที่: ล่าสุด → เก่าสุด
                </SelectItem>
                <SelectItem value="date-asc">
                  วันที่: เก่าสุด → ล่าสุด
                </SelectItem>
                <SelectItem value="sales-desc">ยอดขาย: สูง → ต่ำ</SelectItem>
                <SelectItem value="sales-asc">ยอดขาย: ต่ำ → สูง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="flex-1 bg-transparent"
            >
              <Eye className="w-4 h-4 mr-2" />
              ดูตัวอย่าง
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              พิมพ์
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full">
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
