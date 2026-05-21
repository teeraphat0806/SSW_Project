import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { InvoiceItem } from "./CreateAcquittanceDialog";

interface MonthSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceList: InvoiceItem[];
  selectedInvoices: InvoiceItem[];
  onConfirm: (invoices: InvoiceItem[]) => void;
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export default function MonthSelectionModal({
  open,
  onOpenChange,
  invoiceList,
  selectedInvoices,
  onConfirm,
}: MonthSelectionModalProps) {
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  // Calculate which months have unselected invoices
  const monthsWithAvailableData = useMemo(() => {
    const months = new Set<number>();
    invoiceList.forEach((invoice) => {
      const isInvoiceSelected = selectedInvoices.some(
        (sel) => sel.id === invoice.id,
      );
      if (!isInvoiceSelected) {
        const date = new Date(invoice.createdAt);
        months.add(date.getMonth());
      }
    });
    return months;
  }, [invoiceList, selectedInvoices]);

  const handleMonthToggle = (monthIndex: number) => {
    setSelectedMonths((prev) => {
      if (prev.includes(monthIndex)) {
        return prev.filter((m) => m !== monthIndex);
      } else {
        return [...prev, monthIndex];
      }
    });
  };

  const handleSelectAllAvailable = () => {
    const allAvailable = Array.from(monthsWithAvailableData);
    setSelectedMonths(allAvailable);
  };

  const handleConfirm = () => {
    const invoicesByMonth = invoiceList.filter((invoice) => {
      const date = new Date(invoice.createdAt);
      return selectedMonths.includes(date.getMonth());
    });
    onConfirm(invoicesByMonth);
    setSelectedMonths([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedMonths([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            เลือกเดือนที่ต้องการ
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 my-6">
          {THAI_MONTHS.map((month, index) => {
            const hasData = monthsWithAvailableData.has(index);
            const isSelected = selectedMonths.includes(index);

            return (
              <div
                key={index}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${
                  hasData
                    ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800"
                    : "cursor-not-allowed opacity-50"
                }`}
                onClick={() => hasData && handleMonthToggle(index)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => hasData && handleMonthToggle(index)}
                  disabled={!hasData}
                  className={!hasData ? "opacity-50" : ""}
                />
                <label
                  className={`text-sm font-medium select-none ${
                    hasData
                      ? "cursor-pointer"
                      : "cursor-not-allowed text-gray-400 dark:text-zinc-600"
                  }`}
                  onClick={() => hasData && handleMonthToggle(index)}
                >
                  {month}
                </label>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            onClick={handleSelectAllAvailable}
            disabled={monthsWithAvailableData.size === 0}
            className="flex-1 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            เลือกทั้งหมด
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
          เดือนที่เป็นสีเทาแสดงว่าไม่มีข้อมูล Invoice ในเดือนนั้น
        </p>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedMonths.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            ตกลง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
