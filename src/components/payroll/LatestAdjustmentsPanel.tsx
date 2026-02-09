"use client";
import { Info } from "lucide-react";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import DeleteConfirmButton from "../DeleteButton";
import { EmptyState } from "./EmptyState";
import { isOtherIncome } from "../../lib/payroll-utils";
import type { Employee, SalaryAdjustment } from "../../types/payroll";
import type { OtherIncomeType } from "../../lib/payroll-utils";

interface LatestAdjustmentsPanelProps {
  adjustmentType: "salary" | "other";
  latestList: SalaryAdjustment[];
  employees: Employee[];
  employeeById: Map<string, Employee>;
  otherIncomeTypes: OtherIncomeType[];
  latestEmployeeOnly: string;
  onEmployeeChange: (value: string) => void;
  onDeleteStaffIncome: (id: string | number) => void;
}

export function LatestAdjustmentsPanel({
  adjustmentType,
  latestList,
  employees,
  employeeById,
  otherIncomeTypes,
  latestEmployeeOnly,
  onEmployeeChange,
  onDeleteStaffIncome,
}: LatestAdjustmentsPanelProps) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">รายการล่าสุด</h2>
        <Badge variant="outline" className="rounded-full">
          {adjustmentType === "salary" ? "เงินเดือน" : "รายได้อื่น"}
        </Badge>
      </div>

      <div className="space-y-2">
        <Label>พนักงาน</Label>
        <Select value={latestEmployeeOnly} onValueChange={onEmployeeChange}>
          <SelectTrigger>
            <SelectValue placeholder="เลือกพนักงาน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">ทั้งหมด</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {latestEmployeeOnly === "none" ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" />
          กรุณาเลือกพนักงานเพื่อดูรายการล่าสุด
        </div>
      ) : latestList.length === 0 ? (
        <EmptyState message="ยังไม่มีรายการปรับล่าสุดสำหรับพนักงานนี้" />
      ) : (
        <ScrollArea className="h-[280px] [&>[data-radix-scroll-area-viewport]]:pr-3">
          <div className="space-y-3 ">
            {latestList.map((adjustment) => {
              const employee = employeeById.get(String(adjustment.staffId));
              const positive = adjustment.amount >= 0;
              return (
                <div
                  key={adjustment.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base">
                          {employee?.name}
                        </p>
                        <Badge
                          className="rounded-full text-xs"
                          variant={
                            isOtherIncome(adjustment, otherIncomeTypes)
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {isOtherIncome(adjustment, otherIncomeTypes)
                            ? "รายได้อื่น"
                            : "เงินเดือน"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {adjustment.detail}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p
                        className={`font-bold text-lg ${
                          positive
                            ? "text-green-600 dark:text-green-500"
                            : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {positive ? "+" : ""}฿
                        {adjustment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(adjustment.date).toLocaleDateString()}
                      </p>
                      {isOtherIncome(adjustment, otherIncomeTypes) ? (
                        <DeleteConfirmButton
                          onConfirm={() => onDeleteStaffIncome(adjustment.id)}
                          label="การลบนี้ไม่สามารถย้อนกลับได้"
                        />
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Summary - Current Salary or Total Other Income */}
      {latestEmployeeOnly !== "none" &&
        latestList.length > 0 &&
        (() => {
          const emp = employees.find(
            (e) => String(e.id) === latestEmployeeOnly,
          );
          if (!emp) return null;

          if (adjustmentType === "salary") {
            return (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    เงินเดือนปัจจุบัน
                  </span>
                  <span className="text-2xl font-bold">
                    ฿{emp.currentSalary?.toLocaleString() || "0"}
                  </span>
                </div>
              </div>
            );
          } else {
            const totalOtherIncome = latestList.reduce(
              (sum, item) => sum + item.amount,
              0,
            );
            return (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    รวมรายได้อื่นทั้งหมด
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-500">
                    ฿{totalOtherIncome.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          }
        })()}
    </div>
  );
}
