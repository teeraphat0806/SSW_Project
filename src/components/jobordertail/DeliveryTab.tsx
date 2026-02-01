// src/components/jobordertail/DeliveryTab.tsx
"use client";
import { useState } from "react";
import * as React from "react";
import {
  Truck,
  Calendar,
  MapPin,
  Package,
  Check,
  AlertCircle,
  Box,
  Copy,
  ExternalLink,
  RotateCcw,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types (คงเดิม)
export type JobStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type SteelItem = {
  steelType: string;
  amount: number;
  width?: number;
  length?: number;
  thickness?: number;
  price: number;
  weight: number;
  detail?: string;
  density: number;
  shape: string;
};

export type DeliveryTabProps = {
  status: JobStatus;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
  items?: SteelItem[];
  onUpdateStatus: (newStatus: JobStatus) => void;
  className?: string;
};

export function DeliveryTab({
  status,
  deliveryDate,
  deliveryAddress,
  items = [],
  onUpdateStatus,
  className,
}: DeliveryTabProps) {
  const [checkedState, setCheckedState] = React.useState<
    Record<number, boolean>
  >({});
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  // Logic Checklist
  const handleCheck = (index: number) => {
    // ยอมให้ติ๊กได้ตอน ready หรือ shipped (เผื่อคนขับรถเช็คของตอนขึ้นรถ)
    if (status !== "ready" && status !== "shipped") return;
    setCheckedState((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCheckAll = () => {
    if (status !== "ready" && status !== "shipped") return;
    const allChecked =
      items.length > 0 && items.every((_, idx) => checkedState[idx]);
    if (allChecked) {
      setCheckedState({});
    } else {
      const newState: Record<number, boolean> = {};
      items.forEach((_, idx) => (newState[idx] = true));
      setCheckedState(newState);
    }
  };

  // Logic Address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(deliveryAddress ?? "");
    setIsAddressCopied(true);
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(deliveryAddress ?? "");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank",
    );
  };

  const allChecked =
    items.length > 0 && items.every((_, idx) => checkedState[idx]);
  const checkedCount = Object.keys(checkedState).length;

  // Status Checks
  const isReadyStep = status === "ready";
  const isShippedStep = status === "shipped"; // สถานะปัจจุบันคือส่งของแล้ว
  const isPostReady = isShippedStep; // ใช้สำหรับล็อกสถานะเช็คของ

  // const progressPercent =
  //   items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <div
      className={cn(
        "px-5 py-6 space-y-8 animate-in fade-in duration-500",
        className,
      )}
    >
      {/* 1. Address Section (ย้ายมาไว้บนสุดเพื่อให้เห็นที่อยู่ชัดเจนสำหรับคนจัดส่ง) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header Banner */}
          <div
            className={cn(
              "relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between",
              isPostReady
                ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                : "bg-card dark:bg-zinc-900/50 dark:border-zinc-800",
            )}
          >
            <div className="flex items-center gap-4 z-10">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-colors",
                  isPostReady
                    ? "bg-blue-100 text-blue-600 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800"
                    : "bg-amber-100 text-amber-600 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
                )}
              >
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {isPostReady
                    ? "สินค้าอยู่ระหว่างจัดส่ง"
                    : "เตรียมจัดส่งสินค้า"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isPostReady
                    ? "สินค้ากำลังเดินทางไปยังลูกค้า"
                    : "ตรวจสอบรายการและยืนยันการนำส่ง"}
                </p>
              </div>
            </div>
            {deliveryDate && (
              <div className="z-10 flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  กำหนดส่ง:{" "}
                  <span className="font-medium text-foreground">
                    {deliveryDate}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <h5 className="font-semibold flex items-center gap-2 text-sm text-foreground">
                <Package className="h-4 w-4" /> รายการสินค้าขึ้นรถ
              </h5>
              <div className="text-xs text-muted-foreground">
                เช็คแล้ว {isPostReady ? items.length : checkedCount}/
                {items.length}
              </div>
            </div>

            <div className="divide-y dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  ไม่มีรายการสินค้า
                </div>
              ) : (
                items.map((item, idx) => {
                  const isChecked = checkedState[idx] || isPostReady;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleCheck(idx)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                        isChecked && "bg-blue-50/50 dark:bg-blue-900/10",
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center transition-all",
                          isChecked
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-muted-foreground/30",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3",
                            isChecked ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.steelType}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.width} x {item.length} x {item.thickness}
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {item.amount}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
            {!isPostReady && (
              <div className="border-t p-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckAll}
                  className="text-xs h-8"
                >
                  {allChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Address & Action */}
        <div className="space-y-6">
          {/* Address Card */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="border-b bg-muted/20 px-4 py-3">
              <h4 className="flex items-center gap-2 font-semibold text-sm">
                <MapPin className="h-4 w-4 text-red-500" /> ที่อยู่จัดส่ง
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-dashed">
                {deliveryAddress || "-"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="text-xs h-8 gap-2"
                >
                  {isAddressCopied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  คัดลอก
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGoogleMaps}
                  className="text-xs h-8 gap-2"
                >
                  <ExternalLink className="h-3 w-3" /> นำทาง
                </Button>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur p-4 shadow-sm space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  ยืนยันการจัดส่ง
                </h5>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  ตรวจสอบรายการให้ครบ แล้วกดเพื่อเปลี่ยนสถานะเป็น กำลังจัดส่ง
                </p>
              </div>

              {/* Status badge (optional but helpful) */}
              {status === "ready" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
                  onClick={() => onUpdateStatus("weighing")}
                  title="ย้อนกลับสถานะ (Undo)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isReadyStep ? (
              <div className="space-y-3">
                {/* Warning callout when not all checked */}
                {!allChecked && (
                  <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          ยังตรวจสอบสินค้าไม่ครบ
                        </p>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                          กรุณาติ๊กตรวจสอบให้ครบทุกบรรทัดก่อน
                          เพื่อป้องกันการส่งของผิด/ขาด
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary action */}
                <Button
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onUpdateStatus("shipped")}
                  disabled={!allChecked}
                >
                  <Play className="h-3 w-3 fill-current" />
                  ยืนยันจัดส่งสินค้า{" "}
                </Button>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  เมื่อยืนยันแล้ว ระบบจะล็อกขั้นตอนการผลิต และไปขั้นตอนการจัดส่ง
                </p>
              </div>
            ) : isPostReady ? (
              <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                <div className="flex items-start gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      ส่งสินค้าเรียบร้อย
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                      สามารถกด “เสร็จสิ้นงาน” ได้ที่แท็บ{" "}
                      <span className="font-medium">เสร็จสิ้น</span>
                    </p>
                  </div>
                </div>

                {status === "shipped" && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() => onUpdateStatus("ready")}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      ย้อนกลับ
                    </Button>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                      ใช้กรณีย้อนกลับสถานะ เช่น กรณีลูกค้าไม่รับของ
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  รอการผลิตเสร็จสิ้น
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  เมื่อสถานะเป็น พร้อมจัดส่ง แล้วจึงจะยืนยันการจัดส่งได้
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
