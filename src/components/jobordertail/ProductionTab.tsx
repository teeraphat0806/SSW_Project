"use client";

import {
  Scissors,
  Scale,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Play,
  PackageCheck,
  RotateCcw, // เพิ่ม icon สำหรับ Undo
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProductionStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

type ProductionTabProps = {
  status: ProductionStatus;
  onUpdateStatus: (newStatus: ProductionStatus) => void;
  getStatusColor: (status: ProductionStatus) => string;
};

export function ProductionTab({
  status,
  onUpdateStatus,
  getStatusColor,
}: ProductionTabProps) {
  // ลำดับขั้นตอนการผลิต (Production Flow)
  const steps = [
    { id: "pending", label: "รอตัด", icon: Clock },
    { id: "cutting", label: "กำลังตัด", icon: Scissors },
    { id: "weighing", label: "ชั่งน้ำหนัก", icon: Scale },
    { id: "ready", label: "ตัดเสร็จ", icon: PackageCheck },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === status);
  const activeIndex = currentStepIndex === -1 ? 4 : currentStepIndex;

  // คำนวณ % ความคืบหน้า
  const progressPercentage = Math.min(
    100,
    (activeIndex / (steps.length - 1)) * 100
  );

  return (
    <div className="px-5 py-6 space-y-8">
      {/* 1. Status Stepper (Timeline) */}
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 bg-gray-200 left-0 h-1 w-full rounded-full  dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const isActive = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isActive
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                      : "border-muted bg-white text-foreground dark:border-zinc-700 dark:bg-zinc-900"
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground",
                    isCurrent && "font-bold scale-105"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Start Cutting (Pending -> Cutting) */}
        <ActionCard
          title="เริ่มงานตัด"
          description="เปลี่ยนสถานะเป็นกำลังตัด"
          isActive={status === "pending"}
          isCompleted={activeIndex > 0} // ผ่านขั้นตอนนี้ไปแล้ว
          canUndo={status === "cutting"} // ย้อนกลับได้ถ้าสถานะปัจจุบันคือ cutting
          onClick={() => onUpdateStatus("cutting")}
          onUndo={() => onUpdateStatus("pending")}
          icon={<Scissors className="h-5 w-5" />}
          activeLabel="กำลังดำเนินการ..."
          buttonLabel="เริ่มตัด (Start Cutting)"
          color="blue"
        />

        {/* Card 2: Weighing (Cutting -> Weighing) */}
        <ActionCard
          title="ชั่งน้ำหนัก"
          description="บันทึกน้ำหนักเหล็กจริง"
          isActive={status === "cutting"}
          isCompleted={activeIndex > 1}
          canUndo={status === "weighing"} // ย้อนกลับได้ถ้าสถานะปัจจุบันคือ weighing
          onClick={() => onUpdateStatus("weighing")}
          onUndo={() => onUpdateStatus("cutting")}
          icon={<Scale className="h-5 w-5" />}
          activeLabel="รอชั่งน้ำหนัก..."
          buttonLabel="ส่งชั่ง (To Weighing)"
          color="amber"
        />

        {/* Card 3: Ready (Weighing -> Ready) */}
        <ActionCard
          title="เสร็จสิ้นการผลิต"
          description="สินค้าพร้อมสำหรับการจัดส่ง"
          isActive={status === "weighing"}
          isCompleted={activeIndex > 2}
          canUndo={status === "ready"} // ย้อนกลับได้ถ้าสถานะปัจจุบันคือ ready
          onClick={() => onUpdateStatus("ready")}
          onUndo={() => onUpdateStatus("weighing")}
          icon={<CheckCircle2 className="h-5 w-5" />}
          activeLabel="เสร็จสิ้น"
          buttonLabel="ยืนยันเสร็จ (Mark Ready)"
          color="green"
        />
      </div>

    </div>
  );
}

// --- Sub-Component: Action Card ---

interface ActionCardProps {
  title: string;
  description: string;
  isActive: boolean; // สถานะปัจจุบันอยู่ที่การ์ดใบนี้ (รอให้กด)
  isCompleted: boolean; // ผ่านการ์ดใบนี้ไปแล้ว
  canUndo: boolean; // สามารถกดย้อนกลับจากการ์ดใบนี้ได้ (เป็นขั้นตอนล่าสุดที่ทำเสร็จ)
  isDisabled?: boolean; // ปิดการใช้งาน (สำหรับการ์ดในอนาคต)

  onClick: () => void;
  onUndo: () => void;

  icon: React.ReactNode;
  activeLabel: string;
  buttonLabel: string;
  color: "blue" | "amber" | "green";
}

function ActionCard({
  title,
  description,
  isActive,
  isCompleted,
  canUndo,
  isDisabled,
  onClick,
  onUndo,
  icon,
  activeLabel,
  buttonLabel,
  color,
}: ActionCardProps) {
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
    amber: {
      activeCard:
        "border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500",
      completedCard:
        "border-amber-300 bg-amber-50/70 dark:bg-amber-900/40 dark:border-amber-500/60",
      btn: "bg-amber-600 hover:bg-amber-700 text-white",
      icon: "text-amber-600 dark:text-amber-400",
      pingOuter: "bg-amber-400",
      pingInner: "bg-amber-500",
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

  // default: ขั้นตอนอนาคต / ยังไม่ถึง
  let cardClass =
    "bg-card border-border/70 text-muted-foreground opacity-60 dark:bg-zinc-900/50 dark:border-zinc-800";

  if (isActive) {
    // ขั้นตอนปัจจุบัน – เด่นสุด
    cardClass = cn(
      "shadow-md ring-1 ring-border opacity-100 text-foreground",
      currentStyle.activeCard
    );
  } else if (isCompleted) {
    // ขั้นที่ทำเสร็จแล้ว – ยังพอเห็นสีเดิม แต่ซอฟต์ลง
    cardClass = cn(
      "opacity-100 text-muted-foreground",
      currentStyle.completedCard
    );
  }

  const disabled = isDisabled || (!isActive && !isCompleted);

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

          {/* Active Indicator */}
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

      {/* Button / Status */}
      <div className="mt-4">
        {isActive ? (
          <Button
            className={cn("w-full gap-2 transition-all", currentStyle.btn)}
            size="sm"
            onClick={onClick}
            disabled={disabled}
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
