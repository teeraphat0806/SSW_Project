"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";

/* =========================
   Types
========================= */

export type ApiStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type OrderStatus =
  | "รอตัด"
  | "กำลังตัด"
  | "ชั่งน้ำหนัก"
  | "ตัดเสร็จสิ้น"
  | "กำลังส่ง"
  | "เสร็จสิ้น";

/* =========================
   Status Mapping
========================= */

export const toThaiStatus = (s: ApiStatus): OrderStatus => {
  switch (s) {
    case "pending":
      return "รอตัด";
    case "cutting":
      return "กำลังตัด";
    case "weighing":
      return "ชั่งน้ำหนัก";
    case "ready":
      return "ตัดเสร็จสิ้น";
    case "shipped":
      return "กำลังส่ง";
    case "completed":
      return "เสร็จสิ้น";
    default:
      return "รอตัด";
  }
};

export const toApiStatus = (s: OrderStatus): ApiStatus => {
  switch (s) {
    case "รอตัด":
      return "pending";
    case "กำลังตัด":
      return "cutting";
    case "ชั่งน้ำหนัก":
      return "weighing";
    case "ตัดเสร็จสิ้น":
      return "ready";
    case "กำลังส่ง":
      return "shipped";
    case "เสร็จสิ้น":
      return "completed";
    default:
      return "pending";
  }
};

/* =========================
   Props
========================= */

type Props = {
  status: ApiStatus;
  setStatus: (s: ApiStatus) => void;

  ORDER_STATUSES: readonly OrderStatus[];
  STATUS_ICONS: Record<OrderStatus, React.ReactNode>;
};

/* =========================
   Component
========================= */

export default function Stepper({
  status,
  setStatus,
  ORDER_STATUSES,
  STATUS_ICONS,
}: Props) {
  const thaiStatus = toThaiStatus(status);

  const currentStep = useMemo(
    () => ORDER_STATUSES.indexOf(thaiStatus),
    [thaiStatus, ORDER_STATUSES],
  );

  const progressPct = useMemo(() => {
    if (ORDER_STATUSES.length <= 1) return 0;
    return (currentStep / (ORDER_STATUSES.length - 1)) * 100;
  }, [currentStep, ORDER_STATUSES.length]);

  return (
    <section className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
          สถานะการผลิต
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          อัปเดตสถานะงานปัจจุบันเพื่อให้ลูกค้าทราบความคืบหน้า
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Select */}
        <div className="w-full shrink-0 space-y-2 md:w-72">
          <label className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            เปลี่ยนสถานะ
          </label>

          <Select
            value={thaiStatus}
            onValueChange={(v) => setStatus(toApiStatus(v as OrderStatus))}
          >
            <SelectTrigger className="h-11 w-full border-zinc-200 bg-zinc-50 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100">
              <SelectValue />
            </SelectTrigger>

            <SelectContent className="border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    {React.isValidElement(STATUS_ICONS[s]) &&
                      React.cloneElement(
                        STATUS_ICONS[s] as React.ReactElement,
                        { className: "h-5 w-5" } as any,
                      )}
                    <span>{s}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stepper */}
        <div className="flex-1 pb-4 md:pb-0">
          <div className="relative min-w-[600px] px-2 pt-2">
            <div className="absolute left-0 top-6 h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div
              className="absolute left-0 top-6 h-1 rounded-full bg-blue-600 transition-all duration-500 ease-out dark:bg-blue-500"
              style={{ width: `${progressPct}%` }}
            />

            <div className="relative z-10 flex justify-between">
              {ORDER_STATUSES.map((s, i) => {
                const isCompleted = i <= currentStep;
                const isActive = s === thaiStatus;

                return (
                  <button
                    key={s}
                    onClick={() => setStatus(toApiStatus(s))}
                    className={`group flex flex-col items-center gap-2 outline-none transition-all ${
                      isActive ? "scale-110" : "hover:scale-105"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                        isCompleted
                          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 dark:border-blue-500 dark:bg-blue-500 dark:shadow-none"
                          : "border-zinc-300 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-700"
                      } ${
                        isActive
                          ? "ring-4 ring-blue-100 dark:ring-blue-900/40"
                          : ""
                      }`}
                    >
                      {React.isValidElement(STATUS_ICONS[s]) &&
                        React.cloneElement(
                          STATUS_ICONS[s] as React.ReactElement,
                          { className: "h-5 w-5" } as any,
                        )}
                    </div>

                    <span
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : isCompleted
                            ? "text-zinc-700 dark:text-zinc-300"
                            : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {s}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
