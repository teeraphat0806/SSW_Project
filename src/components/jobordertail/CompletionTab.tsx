"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  CalendarDays,
  Scale,
  Hash,
  BadgeCent,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  JobOrder,
  JobStatus,
} from "@/app/job-order-detail/[id]/JobOrderDetailClient"; // ปรับ path ตามจริง

// Helper function to format date/time
const formatDate = (date: Date | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface CompletionTabProps {
  jobOrder: JobOrder | null;
  onUpdateStatus: (newStatus: JobStatus) => void;
}

export function CompletionTab({
  jobOrder,
  onUpdateStatus,
}: CompletionTabProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!jobOrder) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        ไม่พบข้อมูลงาน
      </div>
    );
  }

  const isCompleted = jobOrder.status === "completed";

  // Calculate Summaries
  const totalItems = jobOrder.steel.length;
  const totalWeight = jobOrder.steel.reduce(
    (acc, item) => acc + item.weight,
    0,
  );
  const totalPrice = jobOrder.steel.reduce((acc, item) => acc + item.price, 0);

  const handleCompleteJob = () => {
    onUpdateStatus("completed");
    setIsConfirming(false);
  };

  // ------------------------------------------
  // VIEW 1: งานเสร็จสมบูรณ์แล้ว (Completed View)
  // ------------------------------------------
  if (isCompleted) {
    return (
      <div className="px-5 py-8 animate-in fade-in zoom-in duration-500">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          {/* Success Icon Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
              <div className="relative bg-white rounded-full p-2 shadow-sm border border-green-100">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              งานเสร็จสมบูรณ์
            </h2>
            <p className="text-muted-foreground">
              ปิดงานเรียบร้อยแล้วเมื่อ{" "}
              {formatDate(jobOrder.completedAt || new Date())}
            </p>
          </div>

          {/* Summary Card */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-1">
                <Hash className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">จำนวนสินค้า</span>
              <span className="text-xl font-bold">{totalItems} รายการ</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-2 border-l-0 md:border-l border-t md:border-t-0 border-dashed border-gray-200">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full mb-1">
                <Scale className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">น้ำหนักรวม</span>
              <span className="text-xl font-bold">
                {totalWeight.toLocaleString()} kg
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 p-2 border-l-0 md:border-l border-t md:border-t-0 border-dashed border-gray-200">
              <div className="p-3 bg-green-50 text-green-600 rounded-full mb-1">
                <BadgeCent className="h-5 w-5" />
              </div>
              <span className="text-sm text-muted-foreground">มูลค่ารวม</span>
              <span className="text-xl font-bold">
                {totalPrice.toLocaleString()} ฿
              </span>
            </div>
          </div>

          <div className="pt-6">
            <Button variant="outline" className="gap-2" disabled>
              <Lock className="h-4 w-4" /> ปิดงานแล้ว (แก้ไขไม่ได้)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // VIEW 2: ยืนยันการปิดงาน (Action View)
  // ------------------------------------------
  return (
    <div className="px-5 py-6 space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-primary" />
            สรุปและปิดงาน
          </h2>
          <p className="text-muted-foreground mt-1">
            ตรวจสอบความถูกต้องครั้งสุดท้ายก่อนยืนยันปิดงาน
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm text-muted-foreground">
            เลขที่ใบสั่งซื้อ (PO)
          </div>
          <div className="font-mono font-bold text-lg">
            {jobOrder.poNumber || "ไม่ระบุ"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Data */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              ข้อมูลลูกค้า
            </h3>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">
                  ชื่อลูกค้า
                </span>
                <div className="font-medium text-lg">
                  {jobOrder.customerName}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">กำหนดส่ง</span>
                <div className="font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {formatDate(jobOrder.deliveryDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Job Stats Card */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-3 border-b">
              <h3 className="font-semibold text-sm">รายการสรุป</h3>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4 text-center divide-x">
              <div>
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-xs text-muted-foreground">รายการ</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {totalWeight.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">กก. รวม</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {totalPrice.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">บาท</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Area */}
        <div className="md:col-span-1">
          <div
            className={cn(
              "rounded-xl border p-6 h-full flex flex-col justify-between transition-all",
              isConfirming
                ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30"
                : "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30",
            )}
          >
            <div className="space-y-4">
              {isConfirming ? (
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                  <span className="font-bold">ยืนยันการปิดงาน?</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-blue-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="font-bold">พร้อมปิดงาน</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground leading-relaxed">
                {isConfirming
                  ? "การดำเนินการนี้ไม่สามารถย้อนกลับได้ สถานะจะถูกเปลี่ยนเป็น Completed และจะถูกล็อคทันที"
                  : "เมื่อตรวจสอบรายการทั้งหมดครบถ้วนแล้ว กดปุ่มด้านล่างเพื่อยืนยันการเสร็จสิ้นงาน"}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {isConfirming ? (
                <>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 dark:shadow-none"
                    size="lg"
                    onClick={handleCompleteJob}
                  >
                    ยืนยันการปิดงาน
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    size="sm"
                    onClick={() => setIsConfirming(false)}
                  >
                    ยกเลิก
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full group"
                  size="lg"
                  onClick={() => setIsConfirming(true)}
                  // ป้องกันการกดปิดงานถ้ายังไม่ Shippped (Optional: เอาออกได้ถ้าไม่ต้องการเช็ค)
                  disabled={
                    jobOrder.status !== "shipped" && jobOrder.status !== "ready"
                  }
                >
                  ดำเนินการปิดงาน
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}

              {!isConfirming &&
                jobOrder.status !== "shipped" &&
                jobOrder.status !== "ready" && (
                  <p className="text-[10px] text-center text-red-500 bg-white/50 p-1 rounded">
                    * ต้องเปลี่ยนสถานะเป็น Shipped หรือ Ready ก่อน
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
