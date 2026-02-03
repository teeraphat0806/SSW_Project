"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  code: string;
}

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  printType: "invoice" | "receipt" | "billing" | "expense" | null;
  setPrintType: (
    type: "invoice" | "receipt" | "billing" | "expense" | null,
  ) => void;
  printMode: "month" | "range" | "today";
  setPrintMode: (mode: "month" | "range" | "today") => void;
  printMonth: number;
  setPrintMonth: (month: number) => void;
  printYear: number;
  setPrintYear: (year: number) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  selectedPrintCustomer: string;
  setSelectedPrintCustomer: (customer: string) => void;
  customers: Customer[];
  printing: boolean;
  onPrint: () => void;
}

export function PrintReportModal({
  isOpen,
  onClose,
  printType,
  setPrintType,
  printMode,
  setPrintMode,
  printMonth,
  setPrintMonth,
  printYear,
  setPrintYear,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedPrintCustomer,
  setSelectedPrintCustomer,
  customers,
  printing,
  onPrint,
}: PrintReportModalProps) {
  const currentYear = new Date().getFullYear();

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 min-w-[400px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">
          เลือกประเภทเอกสารที่ต้องการพิมพ์
        </h3>

        {/* Print Type Selection */}
        <div className="space-y-3 mb-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="invoice"
                checked={printType === "invoice"}
                onChange={() => setPrintType("invoice")}
              />
              ใบคุม INVOICE
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="receipt"
                checked={printType === "receipt"}
                onChange={() => setPrintType("receipt")}
              />
              ใบเสร็จรับเงิน
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="billing"
                checked={printType === "billing"}
                onChange={() => setPrintType("billing")}
              />
              ใบวางบิล
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printType"
                value="expense"
                checked={printType === "expense"}
                onChange={() => setPrintType("expense")}
              />
              รายงานค่าใช้จ่าย
            </label>
          </div>
        </div>

        {/* Print Mode Selection */}
        <div className="border-t pt-4 mb-4">
          <label className="block text-sm font-medium mb-2">
            เลือกช่วงเวลา
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printMode"
                value="month"
                checked={printMode === "month"}
                onChange={() => setPrintMode("month")}
              />
              พิมพ์ทั้งเดือน
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printMode"
                value="range"
                checked={printMode === "range"}
                onChange={() => setPrintMode("range")}
              />
              กำหนดช่วงวันเริ่มต้น-สิ้นสุด
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="printMode"
                value="today"
                checked={printMode === "today"}
                onChange={() => setPrintMode("today")}
              />
              พิมพ์ของวันนี้
            </label>
          </div>
        </div>

        {/* Month/Year Selection for "month" mode */}
        {printMode === "month" && (
          <div className="border-t pt-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  เลือกเดือน
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-foreground bg-background"
                  value={printMonth}
                  onChange={(e) => setPrintMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2024, m - 1).toLocaleDateString("th-TH", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  เลือกปี
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-foreground bg-background"
                  value={printYear}
                  onChange={(e) => setPrintYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y + 543}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Selection for "range" mode */}
        {printMode === "range" && (
          <div className="border-t pt-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 text-foreground bg-background"
                  value={startDate}
                  max={getTodayString()}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Reset end date if it's before new start date
                    if (endDate && e.target.value > endDate) {
                      setEndDate("");
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 text-foreground bg-background"
                  value={endDate}
                  min={startDate}
                  max={getTodayString()}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!startDate}
                />
              </div>
            </div>
            {startDate && endDate && (
              <p className="text-sm text-muted-foreground mt-2">
                ช่วงเวลา: {new Date(startDate).toLocaleDateString("th-TH")} -{" "}
                {new Date(endDate).toLocaleDateString("th-TH")}
              </p>
            )}
          </div>
        )}

        {/* Today mode info */}
        {printMode === "today" && (
          <div className="border-t pt-4 mb-4">
            <p className="text-sm text-muted-foreground">
              จะพิมพ์รายงานวันที่:{" "}
              {new Date().toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Customer Selection for receipt/billing */}
        {(printType === "receipt" || printType === "billing") && (
          <div className="border-t pt-4 mb-4">
            <label className="block text-sm font-medium mb-2">
              เลือกลูกค้า
            </label>
            <select
              className="w-full border rounded px-3 py-2 text-foreground bg-background"
              value={selectedPrintCustomer}
              onChange={(e) => setSelectedPrintCustomer(e.target.value)}
            >
              <option value="all">ทั้งหมด (แยกใบต่อ 1 ลูกค้า)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <Button
            className="hover:cursor-pointer"
            variant="ghost"
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            className="hover:cursor-pointer"
            variant="default"
            disabled={
              !printType ||
              (printMode === "range" && (!startDate || !endDate)) ||
              ((printType === "receipt" || printType === "billing") &&
                customers.length === 0) ||
              printing
            }
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            {printing ? "กำลังเปิด..." : "พิมพ์"}
          </Button>
        </div>
      </div>
    </div>
  );
}
