"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: number; name: string }>;
  year: number;
}

type DocumentType = "receipt" | "bill";
type PeriodType = "monthly" | "yearly";

export function PrintOptionsDialog({
  open,
  onOpenChange,
  customers,
  year,
}: PrintOptionsDialogProps) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<DocumentType>("receipt");
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");

  const months = [
    { value: 1, label: "มกราคม" },
    { value: 2, label: "กุมภาพันธ์" },
    { value: 3, label: "มีนาคม" },
    { value: 4, label: "เมษายน" },
    { value: 5, label: "พฤษภาคม" },
    { value: 6, label: "มิถุนายน" },
    { value: 7, label: "กรกฎาคม" },
    { value: 8, label: "สิงหาคม" },
    { value: 9, label: "กันยายน" },
    { value: 10, label: "ตุลาคม" },
    { value: 11, label: "พฤศจิกายน" },
    { value: 12, label: "ธันวาคม" },
  ];

  const handlePrint = (isPreview: boolean) => {
    const params = new URLSearchParams({
      year: year.toString(),
      type: periodType,
      ...(periodType === "monthly" && { month: selectedMonth.toString() }),
      customer: selectedCustomer,
      preview: isPreview.toString(),
    });

    const path =
      documentType === "receipt"
        ? "/saledashboards/print/receipt"
        : "/saledashboards/print/bill";

    if (selectedCustomer === "all" && documentType === "bill") {
      // สำหรับใบวางบิล ถ้าเลือกทุกคนให้พิมพ์แยกใบ
      customers.forEach((customer, index) => {
        const customerParams = new URLSearchParams({
          year: year.toString(),
          type: periodType,
          ...(periodType === "monthly" && { month: selectedMonth.toString() }),
          customer: customer.id.toString(),
          preview: isPreview.toString(),
        });

        setTimeout(() => {
          window.open(`${path}?${customerParams.toString()}`, "_blank");
        }, index * 300);
      });
    } else {
      const url = `${path}?${params.toString()}`;
      window.open(url, "_blank");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เลือกรูปแบบการพิมพ์</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Document Type */}
          <div className="grid gap-3">
            <Label>ประเภทเอกสาร</Label>
            <RadioGroup
              value={documentType}
              onValueChange={(value) => setDocumentType(value as DocumentType)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receipt" id="receipt" />
                <Label htmlFor="receipt" className="font-normal cursor-pointer">
                  ใบเสร็จรับเงิน
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bill" id="bill" />
                <Label htmlFor="bill" className="font-normal cursor-pointer">
                  ใบวางบิล
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Period Type */}
          <div className="grid gap-2">
            <Label htmlFor="period-type">ช่วงเวลา</Label>
            <Select
              value={periodType}
              onValueChange={(value) => setPeriodType(value as PeriodType)}
            >
              <SelectTrigger id="period-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">รายเดือน</SelectItem>
                <SelectItem value="yearly">ทั้งปี</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Selector (only show for monthly) */}
          {periodType === "monthly" && (
            <div className="grid gap-2">
              <Label htmlFor="month">เดือน</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(Number(value))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem
                      key={month.value}
                      value={month.value.toString()}
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Customer Selector */}
          <div className="grid gap-2">
            <Label htmlFor="customer">ลูกค้า</Label>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            >
              <SelectTrigger id="customer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">
                  ทุกคน {documentType === "bill" && "(แยกใบ)"}
                </SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handlePrint(true)}
          >
            ดูตัวอย่าง
          </Button>
          <Button type="button" onClick={() => handlePrint(false)}>
            พิมพ์เลย
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
