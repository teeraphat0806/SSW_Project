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
  ArrowRight,
  UserCheck,
  RotateCcw,
  Play,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
export type JobStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type SteelItem = {
  steelType: string;
  amount?: number;
  quantity?: number;
  width: number;
  length: number;
  thickness: number;
  weight: number;
  price: number;
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
  // State สำหรับเก็บสถานะการติ๊กสินค้า
  const [checkedState, setCheckedState] = React.useState<
    Record<number, boolean>
  >({});
  const [isAddressCopied, setIsAddressCopied] = useState(false);

  // Logic จัดการการติ๊ก
  const handleCheck = (index: number) => {
    if (status !== "ready") return;
    setCheckedState((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCheckAll = () => {
    if (status !== "ready") return;
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

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(deliveryAddress ?? "");
    setIsAddressCopied(true);
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(deliveryAddress ?? "");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  const allChecked =
    items.length > 0 && items.every((_, idx) => checkedState[idx]);
  const checkedCount = Object.keys(checkedState).length;
  const progressPercent =
    items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  // Status Checks
  const isReadyStep = status === "ready";
  const isShippedStep = status === "shipped";
  const isCompletedStep = status === "completed";
  const isPostReady = isShippedStep || isCompletedStep;

  return (
    <div
      className={cn(
        "px-5 py-6 space-y-8 animate-in fade-in duration-500",
        className
      )}
    >
      {/* --- 1. Status Banner --- */}
      <div
        className={cn(
          "relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between",
          isCompletedStep
            ? "bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
            : "bg-card dark:bg-zinc-900/50 dark:border-zinc-800"
        )}
      >
        <div
          className={cn(
            "absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-3xl",
            isCompletedStep ? "bg-green-500" : "bg-blue-500"
          )}
        />

        <div className="flex items-center gap-4 z-10">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-colors",
              isCompletedStep
                ? "bg-green-100 text-green-600 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800"
                : isShippedStep
                ? "bg-blue-100 text-blue-600 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800"
                : "bg-amber-100 text-amber-600 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800"
            )}
          >
            {isCompletedStep ? (
              <Check className="h-6 w-6" />
            ) : (
              <Truck className="h-6 w-6" />
            )}
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">
              {isCompletedStep
                ? "จัดส่งสำเร็จ (Completed)"
                : "การจัดส่งสินค้า (Delivery)"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isCompletedStep
                ? "ลูกค้าได้รับสินค้าเรียบร้อยแล้ว"
                : isShippedStep
                ? "สินค้ากำลังเดินทางไปยังลูกค้า"
                : "เตรียมความพร้อมและตรวจสอบสินค้าก่อนส่ง"}
            </p>
          </div>
        </div>

        {deliveryDate && (
          <div className="z-10 flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm dark:bg-zinc-800/50 dark:border-zinc-700">
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

      {/* --- 2. Product Checklist (Moved to Top) --- */}
      <div className="space-y-5">
        {/* Header with Progress */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-1">
            <h5 className="font-semibold flex items-center gap-2 text-foreground text-lg">
              <Package className="h-5 w-5 text-primary" />
              รายการสินค้าที่ต้องตรวจสอบ
            </h5>
            <p className="text-sm text-muted-foreground">
              ติ๊กถูกหน้ารายการเพื่อยืนยันความถูกต้องของสินค้า
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 min-w-[200px]">
            <div className="flex justify-between w-full text-xs text-muted-foreground mb-1">
              <span>ความคืบหน้า</span>
              <span>
                {isPostReady ? items.length : checkedCount} / {items.length}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden dark:bg-zinc-800">
              <div
                className="h-full bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${isPostReady ? 100 : progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Item List Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="grid grid-cols-12 gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground dark:bg-zinc-900/80 dark:border-zinc-800">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 md:col-span-7">รายละเอียดสินค้า</div>
            <div className="col-span-3 md:col-span-2 text-right md:text-left">
              ขนาด
            </div>
            <div className="col-span-2 text-center">จำนวน</div>
          </div>

          <div className="divide-y dark:divide-zinc-800">
            {items.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50">
                  <Box className="h-8 w-8 opacity-40" />
                </div>
                <span className="text-sm">ไม่มีรายการสินค้า</span>
              </div>
            ) : (
              items.map((item, idx) => {
                const isChecked = checkedState[idx] || isPostReady;
                return (
                  <div
                    key={idx}
                    onClick={() => handleCheck(idx)}
                    className={cn(
                      "group grid grid-cols-12 gap-4 px-4 py-4 items-center text-sm transition-all duration-200 cursor-pointer",
                      isChecked
                        ? "bg-primary/5 dark:bg-primary/10"
                        : "hover:bg-muted/50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="col-span-1 flex justify-center">
                      <div
                        className={cn(
                          "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm",
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground scale-100"
                            : "border-muted-foreground/20 bg-background group-hover:border-primary group-hover:scale-110 dark:bg-zinc-800 dark:border-zinc-700"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 stroke-[3] transition-all",
                            isChecked
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-50"
                          )}
                        />
                      </div>
                    </div>
                    <div
                      className={cn(
                        "col-span-6 md:col-span-7 font-medium transition-colors flex flex-col md:flex-row md:items-center gap-1",
                        isChecked ? "text-primary" : "text-foreground"
                      )}
                    >
                      <span>{item.steelType}</span>
                      {isChecked && (
                        <Badge
                          variant="secondary"
                          className="w-fit text-[10px] h-5 px-1.5 font-normal bg-background border dark:bg-zinc-800"
                        >
                          ตรวจสอบแล้ว
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-3 md:col-span-2 text-muted-foreground text-xs font-mono text-right md:text-left">
                      {item.width} x {item.length} x {item.thickness}
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={cn(
                          "inline-block min-w-[2rem] py-0.5 px-2 rounded-md font-mono text-xs font-medium",
                          isChecked
                            ? "bg-primary/20 text-primary dark:bg-primary/30"
                            : "bg-muted dark:bg-zinc-800"
                        )}
                      >
                        {item.quantity || item.amount || 0}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Check All Footer */}
          {isReadyStep && (
            <div className="border-t bg-muted/20 px-4 py-3 flex justify-end dark:border-zinc-800 dark:bg-zinc-900/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCheckAll}
                className="h-8 text-xs text-muted-foreground hover:text-primary gap-2"
              >
                {allChecked ? (
                  <Box className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                {allChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* --- 3. Delivery Steps & Address (Bottom Section) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Process (Steps) */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <h5 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            ขั้นตอนการจัดส่ง (Delivery Process)
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Step 1: Ship (Ready -> Shipped) */}
            <DeliveryStepCard
              title="ยืนยันการจัดส่ง"
              description="สินค้าครบถ้วนพร้อมส่งออก"
              isActive={isReadyStep}
              isCompleted={isShippedStep || isCompletedStep}
              canUndo={isShippedStep} // Undo ได้ถ้าสถานะปัจจุบันคือ Shipped
              isDisabled={!allChecked} // กดไม่ได้ถ้ายังติ๊กไม่ครบ
              onClick={() => onUpdateStatus("shipped")}
              onUndo={() => onUpdateStatus("ready")}
              icon={<Truck className="h-5 w-5" />}
              activeLabel="กำลังดำเนินการ..."
              buttonLabel="ยืนยัน (Shipped)"
              color="blue"
            />

            {/* Arrow Divider (Desktop only) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-card p-1 rounded-full border shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Step 2: Complete (Shipped -> Completed) */}
            <DeliveryStepCard
              title="ส่งถึงลูกค้าสำเร็จ"
              description="ลูกค้ารับสินค้าเรียบร้อย"
              isActive={isShippedStep}
              isCompleted={isCompletedStep}
              canUndo={isCompletedStep} // Undo ได้ถ้าสถานะปัจจุบันคือ Completed
              isDisabled={false}
              onClick={() => onUpdateStatus("completed")}
              onUndo={() => onUpdateStatus("shipped")}
              icon={<UserCheck className="h-5 w-5" />}
              activeLabel="กำลังดำเนินการ..."
              buttonLabel="ยืนยัน (Completed)"
              color="green"
            />
          </div>

          {/* Helper Message for Checklist */}
          {isReadyStep && !allChecked && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-500 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span>
                กรุณาตรวจสอบและติ๊กรายการสินค้าด้านบนให้ครบก่อนดำเนินการ
              </span>
            </div>
          )}
        </div>

        {/* Address Card */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col ">
            <div className="border-b bg-background px-4 py-3 ">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-blue-500" />
                ที่อยู่จัดส่งสินค้า
              </h4>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between gap-4">
              <div className="relative">
                {/* Decorative map pattern background (optional) */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 dark:opacity-10 pointer-events-none" />

                <p className="relative z-10 text-sm leading-relaxed text-foreground">
                  {deliveryAddress}
                </p>
              </div>

              <div className="pt-4 border-t ">
                <Button
                  variant="outline"
                  className={cn(
                    "w-full gap-2 text-xs transition-all duration-200",
                    isAddressCopied
                      ? "hover:bg-primary/5 transition-colors text-blue-500 hover:text-blue-600"
                      : "hover:border-primary hover:text-primary dark:hover:border-primary"
                  )}
                  onClick={handleCopyAddress}
                >
                  {isAddressCopied ? (
                    <>
                      <Check className="h-3 w-3" /> คัดลอกแล้ว
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> คัดลอกที่อยู่
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-xs mt-2 text-muted-foreground border-1 hover:text-primary hover:bg-primary/5 transition-colors"
                  onClick={handleOpenGoogleMaps}
                >
                  <ExternalLink className="h-3 w-3" /> เปิดใน Google Maps
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Delivery Step Card (Styled like ActionCard) ---

interface DeliveryStepCardProps {
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  canUndo: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onUndo: () => void;
  icon: React.ReactNode;
  activeLabel: string;
  buttonLabel: string;
  color: "blue" | "green";
}

function DeliveryStepCard({
  title,
  description,
  isActive,
  isCompleted,
  canUndo,
  isDisabled,
  onClick,
  onUndo,
  icon,

  buttonLabel,
  color,
}: DeliveryStepCardProps) {
  const colorStyles = {
    blue: {
      activeCard:
        "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500",
      completedCard:
        "border-blue-300 bg-blue-50/70 dark:bg-blue-900/40 dark:border-blue-500/60",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: "text-blue-600 dark:text-blue-400",
      pingOuter: "bg-blue-400",
      pingInner: "bg-blue-500",
    },
    green: {
      activeCard:
        "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500",
      completedCard:
        "border-green-300 bg-green-50/70 dark:bg-green-900/40 dark:border-green-500/60",
      btn: "bg-green-600 hover:bg-green-700 text-white",
      icon: "text-green-600 dark:text-green-400",
      pingOuter: "bg-green-400",
      pingInner: "bg-green-500",
    },
  } as const;

  const currentStyle = colorStyles[color];

  // Logic Styling
  let cardClass =
    "bg-card border-border/70 text-muted-foreground opacity-60 dark:bg-zinc-900/50 dark:border-zinc-800"; // Future Step

  if (isActive) {
    cardClass = cn(
      "shadow-md ring-1 ring-border opacity-100 text-foreground",
      currentStyle.activeCard
    );
  } else if (isCompleted) {
    cardClass = cn(
      "opacity-100 text-muted-foreground",
      currentStyle.completedCard
    );
  }

  // Determine if button should be disabled
  // const buttonDisabled = isDisabled || (!isActive && !isCompleted);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200",
        cardClass
      )}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              "rounded-lg p-2 bg-background/80 backdrop-blur-sm",
              isActive || isCompleted
                ? currentStyle.icon
                : "text-muted-foreground"
            )}
          >
            {isCompleted ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
            ) : (
              icon
            )}
          </div>

          {/* Active Ping Animation */}
          {isActive && (
            <span className="relative flex h-2 w-2 mt-1">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  currentStyle.pingOuter
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  currentStyle.pingInner
                )}
              />
            </span>
          )}

          {/* Undo Button */}
          {canUndo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
              onClick={onUndo}
              title="ย้อนกลับสถานะ (Undo)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div>
          <h4
            className={cn(
              "font-semibold",
              isCompleted ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {title}
          </h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {isActive ? (
          <Button
            className={cn("w-full gap-2 transition-all", currentStyle.btn)}
            size="sm"
            onClick={onClick}
            disabled={isDisabled} // เช็คเงื่อนไขเช่น checklist ครบหรือยัง
          >
            <Play className="h-3 w-3 fill-current" />
            {buttonLabel}
          </Button>
        ) : isCompleted ? (
          <div className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed text-xs font-medium text-muted-foreground">
            <Check className="h-3 w-3" /> เสร็จสิ้นแล้ว
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled
          >
            รอขั้นตอนก่อนหน้า
          </Button>
        )}
      </div>
    </div>
  );
}
