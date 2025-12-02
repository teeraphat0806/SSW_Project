"use client";

import { 
  Scissors, 
  Scale, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowRight,
  Play,
  PackageCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // ถ้ามี component progress
// ถ้าไม่มี progress ให้ใช้ div ธรรมดา

type ProductionStatus = "pending" | "cutting" | "weighing" | "ready" | "shipped" | "completed";

type ProductionTabProps = {
  status: ProductionStatus;
  assignedCutter?: string | null;
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
  // ถ้าสถานะเป็น shipped/completed ให้ถือว่าผ่าน process การผลิตหมดแล้ว (index = 4)
  const activeIndex = currentStepIndex === -1 ? 4 : currentStepIndex;

  // คำนวณ % ความคืบหน้า
  const progressPercentage = Math.min(100, (activeIndex / (steps.length - 1)) * 100);

  return (
    <div className="px-5 py-6 space-y-8">
      
      {/* 1. Status Stepper (Timeline) */}
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 h-1 w-full rounded-full bg-blue-200">
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
                      : "border-muted bg-gray-600 text-white "
                  )}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground",
                  isCurrent && "font-bold scale-105"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Action Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Start Cutting */}
        <ActionCard
          title="เริ่มงานตัด"
          description="เปลี่ยนสถานะเป็นกำลังตัด"
          isActive={status === "pending"}
          isDisabled={status !== "pending"}
          onClick={() => onUpdateStatus("cutting")}
          icon={<Scissors className="h-5 w-5" />}
          activeLabel="กำลังดำเนินการ..."
          buttonLabel="เริ่มตัด (Start Cutting)"
          color="blue"
        />

        {/* Card: Weighing */}
        <ActionCard
          title="ชั่งน้ำหนัก"
          description="บันทึกน้ำหนักเหล็กจริง"
          isActive={status === "cutting"}
          isDisabled={status !== "cutting"}
          onClick={() => onUpdateStatus("weighing")}
          icon={<Scale className="h-5 w-5" />}
          activeLabel="รอชั่งน้ำหนัก..."
          buttonLabel="ส่งชั่ง (To Weighing)"
          color="amber"
        />

        {/* Card: Ready */}
        <ActionCard
          title="เสร็จสิ้นการผลิต"
          description="สินค้าพร้อมสำหรับการจัดส่ง"
          isActive={status === "weighing"}
          isDisabled={status !== "weighing"}
          onClick={() => onUpdateStatus("ready")}
          icon={<CheckCircle2 className="h-5 w-5" />}
          activeLabel="เสร็จสิ้น"
          buttonLabel="ยืนยันเสร็จ (Mark Ready)"
          color="green"
        />
      </div>

      {/* 3. Assigned Info */}
      {/* <div className="rounded-xl border bg-muted/30 p-4 dark:bg-zinc-900/50 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                <User className="h-5 w-5 text-muted-foreground" />
             </div>
             <div>
                <p className="text-sm font-medium text-muted-foreground">ผู้รับผิดชอบ (Cutter)</p>
                <p className="text-base font-semibold text-foreground">
                    {assignedCutter || "ยังไม่ระบุ"}
                </p>
             </div>
          </div>
          {status === 'pending' && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                เปลี่ยนผู้รับผิดชอบ
              </Button>
          )}
        </div>
      </div> */}

    </div>
  );
}

// --- Sub-Component: Action Card ---

interface ActionCardProps {
  title: string;
  description: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeLabel: string;
  buttonLabel: string;
  color: 'blue' | 'amber' | 'green';
}

function ActionCard({
  title,
  description,
  isActive,
  isDisabled,
  onClick,
  icon,
  activeLabel,
  buttonLabel,
  color
}: ActionCardProps) {
  
  // Color mapping logic
  const colorStyles = {
    blue: {
        active: "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500",
        btn: "bg-blue-600 hover:bg-blue-700 text-white",
        icon: "text-blue-600 dark:text-blue-400"
    },
    amber: {
        active: "border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500",
        btn: "bg-amber-600 hover:bg-amber-700 text-white",
        icon: "text-amber-600 dark:text-amber-400"
    },
    green: {
        active: "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500",
        btn: "bg-green-600 hover:bg-green-700 text-white",
        icon: "text-green-600 dark:text-green-400"
    }
  };

  const currentStyle = colorStyles[color];

  return (
    <div 
        className={cn(
            "relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200",
            isActive 
                ? cn("shadow-md ring-1", currentStyle.active)
                : "bg-card border-border opacity-60 hover:opacity-100 dark:bg-zinc-900/50 dark:border-zinc-800"
        )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
            <div className={cn("rounded-lg p-2 bg-background/80 backdrop-blur-sm", currentStyle.icon)}>
                {icon}
            </div>
            {isActive && (
                <span className="flex h-2 w-2">
                  <span className={cn("animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75", `bg-${color}-400`)}></span>
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", `bg-${color}-500`)}></span>
                </span>
            )}
        </div>
        <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-4">
        <Button 
            className={cn("w-full gap-2 transition-all", isActive ? currentStyle.btn : "")}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={onClick}
            disabled={isDisabled}
        >
            {isActive ? <Play className="h-3 w-3 fill-current" /> : null}
            {buttonLabel}
        </Button>
      </div>
    </div>
  );
}