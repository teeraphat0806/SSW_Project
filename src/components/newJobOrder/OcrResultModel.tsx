"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // ถ้าไม่มี ใช้ div overflow-auto แทนได้
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle2,
  User,
  Package,
  Ruler,
  FileText,
  X,
} from "lucide-react";

// --- Types (คงเดิม) ---
export type OcrSummaryItem = {
  codeSteel: string;
  thickness: number | null;
  width: number | null;
  length: number | null;
  quantity: number | null;
  description: string | null;
};

export type OcrSummary = {
  customerLine: string;
  items: OcrSummaryItem[];
};

type OcrResultModalProps = {
  open: boolean;
  stage: "loading" | "done";
  summary: OcrSummary | null;
  onClose: () => void;
  titleLoading?: string;
  titleDone?: string;
};

export function OcrResultModal({
  open,
  stage,
  summary,
  onClose,
  titleLoading = "กำลังประมวลผลเอกสาร...",
  titleDone = "สรุปผลการอ่านข้อมูล (OCR)",
}: OcrResultModalProps) {
  if (!open) return null;

  const isDone = stage === "done";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center sm:p-4">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={isDone ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full max-w-lg bg-background rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden transition-all duration-300",
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-2",
          // Responsive Height: เต็มจอบนมือถือ แต่เป็น popup บนจอใหญ่
          "h-[100dvh] sm:h-auto sm:max-h-[85vh]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
          <div className="flex items-center gap-2.5">
            {stage === "loading" ? (
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground text-base">
                {stage === "loading" ? titleLoading : titleDone}
              </h3>
              {isDone && (
                <p className="text-xs text-muted-foreground">
                  ตรวจสอบความถูกต้องก่อนดำเนินการต่อ
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            disabled={!isDone}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          {stage === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 space-y-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin relative z-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-lg">กำลังวิเคราะห์ข้อมูล...</h4>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                  AI กำลังอ่านไฟล์และแปลงเป็นข้อมูลรายการสินค้า กรุณารอสักครู่
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Customer Section */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> ข้อมูลลูกค้า
                </div>
                <div className="p-4 rounded-lg bg-card border shadow-sm flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary text-sm">
                      {summary?.customerLine
                        ? summary.customerLine.charAt(0).toUpperCase()
                        : "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      {summary?.customerLine || (
                        <span className="text-muted-foreground italic">
                          ไม่พบชื่อลูกค้า
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ตรวจพบจากหัวกระดาษ
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" /> รายการสินค้า (
                    {summary?.items.length ?? 0})
                  </div>
                </div>

                <div className="grid gap-3">
                  {(summary?.items ?? []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      ไม่พบรายการสินค้า
                    </div>
                  ) : (
                    summary?.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border bg-card hover:bg-muted/40 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary text-base">
                              {item.codeSteel}
                            </span>
                            {item.description && (
                              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-muted textxs text-muted-foreground truncate max-w-[150px]">
                                {item.description}
                              </span>
                            )}
                          </div>

                          {/* Mobile Description */}
                          {item.description && (
                            <p className="sm:hidden text-xs text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}

                          {/* Dimensions */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              <span>
                                หนา:{" "}
                                <span className="text-foreground font-medium">
                                  {item.thickness ?? "-"}
                                </span>
                              </span>
                            </div>
                            <span>•</span>
                            <span>
                              กว้าง:{" "}
                              <span className="text-foreground font-medium">
                                {item.width ?? "-"}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              ยาว:{" "}
                              <span className="text-foreground font-medium">
                                {item.length ?? "-"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Quantity Badge */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed sm:border-none">
                          <span className="text-xs text-muted-foreground sm:hidden">
                            จำนวน:
                          </span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                          >
                            {item.quantity ?? 0}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            className="w-full sm:w-auto sm:ml-auto sm:flex"
            size="lg"
            onClick={onClose}
            disabled={!isDone}
          >
            <X className="mr-2 h-4 w-4" />
            ปิด
          </Button>
        </div>
      </div>
    </div>
  );
}
