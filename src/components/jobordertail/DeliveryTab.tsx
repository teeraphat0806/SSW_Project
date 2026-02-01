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
  const isCompletedStep = status === "completed"; // จบงานแล้ว
  const isPostReady = isShippedStep || isCompletedStep;

  const progressPercent =
    items.length > 0 ? (checkedCount / items.length) * 100 : 0;

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
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <h5 className="font-semibold text-sm">ดำเนินการ</h5>

            {isReadyStep ? (
              <>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={() => onUpdateStatus("shipped")}
                  disabled={!allChecked}
                >
                  <Truck className="h-4 w-4" /> ยืนยันการจัดส่ง (Shipped)
                </Button>
                {!allChecked && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded-md border border-amber-100">
                    <AlertCircle className="h-3 w-3" /> กรุณาตรวจสอบสินค้าให้ครบ
                  </div>
                )}
              </>
            ) : isPostReady ? (
              <div className="text-center py-4 space-y-2 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-1">
                  <Truck className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  สินค้าถูกส่งออกแล้ว
                </p>
                <p className="text-xs text-muted-foreground">
                  สามารถกดสำเร็จงานได้ที่แท็บ "เสร็จสิ้น"
                </p>
                {status === "shipped" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-red-500 h-7 mt-2"
                    onClick={() => onUpdateStatus("ready")}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> ยกเลิกการส่ง
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-2">
                รอการผลิตเสร็จสิ้น
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
