import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Hash, CalendarClock, Calendar } from "lucide-react";
import { HeadOrderType } from "@/types/order.types";

type HeaderSectionProps = {
  headOrder: HeadOrderType;
  setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>>;
};

export function HeaderSection({ headOrder, setheadOrder }: HeaderSectionProps) {
  const noNumberSpinnerClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const toDisplayDateValue = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              ข้อมูลใบสั่งซื้อ
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
              ระบุเลขที่เอกสาร PO และกำหนดการจัดส่ง
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-8">
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6`}>
          <div className="space-y-2 group">
            <Label
              htmlFor="poNumber"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
            >
              เลขที่ใบ PO <span className="text-red-500">*</span>
            </Label>
            <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="poNumber"
                placeholder="ระบุเลข PO (เช่น PO-2025001)"
                value={headOrder.poNumber ?? ""}
                onChange={(e) => {
                  const targetValue = e.target.value;
                  setheadOrder({
                    ...headOrder,
                    poNumber: targetValue.trim() === "" ? null : targetValue,
                  });
                }}
                className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <Label
              htmlFor="credit"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
            >
              เครดิต Credit<span className="text-red-500">*</span>
            </Label>
            <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
              <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="credit"
                placeholder="ระบุเครดิต ( 30 )"
                type="number"
                min="0"
                value={headOrder.credit}
                onChange={(e) =>
                  setheadOrder({
                    ...headOrder,
                    credit: Number(e.target.value),
                  })
                }
                className={`pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${noNumberSpinnerClass}`}
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <Label
              htmlFor="createdAt"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
            >
              วันที่สร้างบิล
            </Label>
            <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <Input
                id="createdAt"
                type="date"
                value={headOrder.createdAt ?? ""}
                onChange={(e) =>
                  setheadOrder({ ...headOrder, createdAt: e.target.value })
                }
                className="absolute inset-0 z-10 w-full h-11 cursor-pointer opacity-0 pl-10 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
              />
              <div className="pointer-events-none flex h-11 w-full items-center rounded-md border border-input bg-transparent pl-9 pr-3 text-sm">
                <div className="flex w-full items-center justify-between">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {headOrder.createdAt
                      ? toDisplayDateValue(headOrder.createdAt)
                      : "เลือกวันที่"}
                  </span>
                  <Calendar className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 group">
            <Label
              htmlFor="deliveryDate"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
            >
              วันที่ต้องการส่ง <span className="text-red-500">*</span>
            </Label>
            <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <Input
                id="deliveryDate"
                type="date"
                value={headOrder.deliveryDate}
                onChange={(e) => {
                  setheadOrder({
                    ...headOrder,
                    deliveryDate: e.target.value,
                  });
                }}
                className="absolute inset-0 z-10 w-full h-11 cursor-pointer opacity-0 pl-10 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all [color-scheme:light] dark:[color-scheme:dark]"
              />
              <div className="pointer-events-none flex h-11 w-full items-center rounded-md border border-input bg-transparent pl-9 pr-3 text-sm">
                <div className="flex w-full items-center justify-between">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {headOrder.deliveryDate
                      ? toDisplayDateValue(headOrder.deliveryDate)
                      : "เลือกวันที่"}
                  </span>
                  <Calendar className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
