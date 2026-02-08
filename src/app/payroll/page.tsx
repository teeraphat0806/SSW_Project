"use client";
import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { Pencil, FileText, ListChecks } from "lucide-react";
import { SalaryAdjustmentForm } from "../../components/payroll/SalaryAdjustmentForm";
import { PayslipGenerator } from "../../components/payroll/PayslipGenerator";
import { EmployeeDirectory } from "../../components/payroll/EmployeeDirectory";
import { EmployeeOverview } from "../../components/payroll/EmployeeOverview";
import { ManageOtherIncomeModal } from "../../components/payroll/ManageOtherIncomeModal";
import { LatestAdjustmentsPanel } from "../../components/payroll/LatestAdjustmentsPanel";
import { SalaryHistoryTable } from "../../components/payroll/SalaryHistoryTable";
import type { Employee, SalaryAdjustment } from "../../types/payroll";
import { ToastContainer, toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { usePayrollData } from "../../hooks/usePayrollData";
import {
  isOtherIncome,
  inTimeframeMode,
  inferTypesFromAmount,
} from "../../lib/payroll-utils";
import type {
  TimeframeMode,
  ChartMetric,
  OtherIncomeType,
} from "../../lib/payroll-utils";
import {
  updateEmployeeSalary,
  addStaffIncome,
  addStaffSalary,
  deleteStaffIncome,
  addOtherIncomeType,
  updateOtherIncomeType,
  removeOtherIncomeType,
} from "../../lib/payroll-api";
import { StaffIncomeDirectory } from "@/components/payroll/StaffIncomeDierectory";
/* =========================
   Page
========================= */
export default function PayrollPage() {
  /* Use custom hook for data management */
  const {
    employees,
    setEmployees,
    adjustments,
    setAdjustments,
    otherIncomeTypes,
    setOtherIncomeTypes,
    loading,
    adjustmentType,
    setAdjustmentType,
  } = usePayrollData();

  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] =
    useState<Employee | null>(null);
  const [latestEmployeeOnly, setLatestEmployeeOnly] = useState<"none" | string>(
    "none",
  );
  const [manageOpen, setManageOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [otherIncomeDialogOpen, setOtherIncomeDialogOpen] = useState(false);

  // Overview filters (not actively used but kept for future)
  const [overviewEmployee, setOverviewEmployee] = useState<string | "all">(
    "all",
  );
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>("all");
  const allYearsSortedDesc = useMemo(
    () =>
      Array.from(
        new Set(adjustments.map((a) => new Date(a.date).getFullYear())),
      ).sort((a, b) => b - a),
    [adjustments],
  );
  const defaultYear = allYearsSortedDesc[0] ?? new Date().getFullYear();
  const [selectedYearForChart, setSelectedYearForChart] =
    useState<number>(defaultYear);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("net");

  /* Derived – Dashboard */
  const dashboardSlice = useMemo(() => {
    return adjustments.filter((adj) => {
      const empOk =
        overviewEmployee === "all" || adj.staffId === overviewEmployee;
      const tfOk = inTimeframeMode(
        adj.date,
        timeframeMode,
        selectedYearForChart,
      );
      return empOk && tfOk;
    });
  }, [adjustments, overviewEmployee, timeframeMode, selectedYearForChart]);

  const dashboardMetrics = useMemo(() => {
    const base = {
      totalNet: 0,
      salaryIncreases: 0,
      salaryDecreases: 0,
      otherIncome: 0,
    };
    return dashboardSlice.reduce((acc, adj) => {
      acc.totalNet += adj.amount;
      if (isOtherIncome(adj, otherIncomeTypes)) {
        acc.otherIncome += adj.amount;
      } else {
        if (adj.amount >= 0) acc.salaryIncreases += adj.amount;
        else acc.salaryDecreases += adj.amount;
      }
      return acc;
    }, base);
  }, [dashboardSlice, otherIncomeTypes]);

  const employeeById = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach((e) => m.set(String(e.id), e));
    return m;
  }, [employees]);

  /* Derived – Adjustment latest panel */
  const latestList = useMemo(() => {
    return adjustments
      .filter((a) => {
        const isOther = isOtherIncome(a, otherIncomeTypes);
        const matchType = adjustmentType === "salary" ? !isOther : isOther;
        const matchEmp =
          latestEmployeeOnly === "none"
            ? true
            : String(a.staffId) === String(latestEmployeeOnly);
        return matchType && matchEmp;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [adjustments, otherIncomeTypes, adjustmentType, latestEmployeeOnly]);

  /* Handlers */
  const handleSalaryAdjustment = async (
    adjustment: Omit<SalaryAdjustment, "id" | "date" | "type">,
    type: "salary" | "other",
    nameIncome?: string,
  ) => {
    const amountNum = Number(adjustment.amount) || 0;
    const newAdjustment: SalaryAdjustment = {
      ...adjustment,
      amount: amountNum,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: amountNum >= 0 ? "increase" : "decrease",
    };

    try {
      if (type === "other") {
        await addStaffIncome(
          Number(newAdjustment.staffId),
          amountNum,
          newAdjustment.detail || "",
          nameIncome || otherIncomeTypes[0]?.name || "OT",
        );
      } else {
        // Get current salary
        const employee = employees.find(
          (e) => String(e.id) === String(newAdjustment.staffId),
        );
        if (!employee) throw new Error("Employee not found");

        const updatedSalary = employee.currentSalary + amountNum;

        // Update employee salary
        await updateEmployeeSalary(newAdjustment.staffId, updatedSalary);

        // Add salary record
        await addStaffSalary(
          Number(newAdjustment.staffId),
          amountNum,
          newAdjustment.detail || "ปรับเงินเดือน",
        );

        // Update local state
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === Number(adjustment.staffId)
              ? { ...emp, currentSalary: updatedSalary }
              : emp,
          ),
        );
      }

      setAdjustments((prev) => [newAdjustment, ...prev]);
    } catch (err) {
      toast.error(`พบข้อผิดพลาด: ${err}`, { position: "bottom-right" });
      console.error(err);
    }
  };

  const handleGeneratePayslip = (employee: Employee) =>
    setSelectedEmployeeForPayslip(employee);
  const handleClosePayslip = () => setSelectedEmployeeForPayslip(null);

  const handleDeleteStaffIncome = async (id: string | number) => {
    try {
      await deleteStaffIncome(id);
      setAdjustments((prev) => prev.filter((a) => a.id !== String(id)));
    } catch (error) {
      console.error(error);
    }
  };
  /* Payslip overlay */
  if (selectedEmployeeForPayslip) {
    return (
      <PayslipGenerator
        employee={selectedEmployeeForPayslip}
        onClose={handleClosePayslip}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-full flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="mr-2 h-12 w-12 animate-spin" />
          <p className="text-lg mt-4 ">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 md:ml-24 transition-colors duration-300 font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ระบบจัดการพนักงาน
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            จัดการพนักงาน รายได้พนักงาน และออกสลิปแบบครบจบในที่เดียว
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-white/50 dark:bg-zinc-900/50 p-1 gap-0 border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger
            value="overview"
            className="w-full text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg py-2 md:py-3 text-zinc-700 dark:text-zinc-300"
          >
            พนักงาน
          </TabsTrigger>
          <TabsTrigger
            value="adjustment"
            className="w-full text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg py-2 md:py-3 text-zinc-700 dark:text-zinc-300"
          >
            ปรับเงิน
          </TabsTrigger>
          <TabsTrigger
            value="directory"
            className="w-full text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg py-2 md:py-3 text-zinc-700 dark:text-zinc-300"
          >
            สลิป
          </TabsTrigger>
        </TabsList>

        {/* ========= OVERVIEW ========= */}
        <TabsContent value="overview" className="space-y-6">
          {/* Employee Directory Table */}
          <div className="pb-3 pt-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              ตารางข้อมูลพนักงาน
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              ข้อมูลพนักงานทั้งหมดที่ลงทะเบียนในระบบ
            </p>
          </div>
          <EmployeeDirectory employees={employees} />

          {/* Salary History Table */}
        </TabsContent>

        {/* ========= ADJUSTMENT ========= */}
        <TabsContent value="adjustment" className="space-y-4 md:space-y-6">
          <div className="flex justify-between items-end ">
            <div className="pb-3 pt-6">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                ประวัติการปรับเงินเดือน
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                ประวัติการปรับเงินเดือนย้อนหลังของพนักงานทั้งหมด
              </p>
            </div>{" "}
            <Button
              onClick={() => setSalaryDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span className="text-sm font-medium">ปรับเงินเดือนพนักงาน</span>
            </Button>
          </div>
          <SalaryHistoryTable />
          <div className="flex justify-between items-end ">
            <div className="pb-3 pt-6">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                ประวัติการรายได้อื่นพนักงาน
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                ประวัติรายได้อื่นย้อนหลังของพนักงานทั้งหมด
              </p>
            </div>
            <Button
              onClick={() => setOtherIncomeDialogOpen(true)}
              className=" bg-amber-600 hover:bg-amber-700 text-white"
              size="lg"
            >
              <span className="text-sm font-medium">ปรับรายได้พิเศษ</span>
            </Button>
          </div>
          <StaffIncomeDirectory />

          {/* Dialog: ปรับเงินเดือน */}
          <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 border-b border-blue-200 dark:border-blue-800 rounded-t-lg">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  ปรับรายได้พนักงาน
                </h2>
              </div>
              <div className="p-6">
                <SalaryAdjustmentForm
                  employees={employees}
                  adjustmentType="salary"
                  onEmployeeChange={(staffId) => setLatestEmployeeOnly(staffId)}
                  onAdjustmentSubmit={(payload) => {
                    handleSalaryAdjustment(payload, "salary");
                    setSalaryDialogOpen(false);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog: ปรับรายได้อื่น */}
          <Dialog
            open={otherIncomeDialogOpen}
            onOpenChange={setOtherIncomeDialogOpen}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 border-b border-amber-200 dark:border-amber-800 rounded-t-lg">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-amber-600" />
                  ปรับรายได้พิเศษพนักงาน
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> เลือกรายการรายได้อื่น
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      defaultValue={otherIncomeTypes[0]?.name ?? "OT"}
                      onValueChange={(v) => {
                        const el = document.getElementById(
                          "other-income-select",
                        ) as HTMLInputElement | null;
                        if (el) el.value = v;
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="เลือกรายการ" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherIncomeTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          title="จัดการรายการรายได้อื่น"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          แก้ไข
                        </Button>
                      </DialogTrigger>
                      <ManageOtherIncomeModal
                        types={otherIncomeTypes}
                        onAdd={async (name, amount) => {
                          try {
                            const types = inferTypesFromAmount(amount);
                            const created = await addOtherIncomeType(
                              name,
                              amount ?? 0,
                              types,
                            );
                            setOtherIncomeTypes((prev) => [created, ...prev]);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onUpdate={async (id, name, amount) => {
                          try {
                            const types = inferTypesFromAmount(amount);
                            const updated = await updateOtherIncomeType(
                              id,
                              name,
                              amount ?? 0,
                              types,
                            );
                            setOtherIncomeTypes((prev) =>
                              prev.map((t) =>
                                t.id === id ? { ...t, ...updated } : t,
                              ),
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onRemove={async (id) => {
                          try {
                            await removeOtherIncomeType(id);
                            setOtherIncomeTypes((prev) =>
                              prev.filter((t) => t.id !== id),
                            );
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      />
                    </Dialog>
                  </div>
                  {/* ซ่อนไว้ใช้ bridge ค่าให้กับฟอร์ม */}
                  <input id="other-income-select" hidden />
                  <p className="text-xs text-muted-foreground">
                    * เพิ่ม/แก้ไข/ลบ รายการได้ผ่านปุ่ม "แก้ไข"
                  </p>
                </div>

                <Separator />

                <SalaryAdjustmentForm
                  employees={employees}
                  adjustmentType="other"
                  onEmployeeChange={(staffId) => setLatestEmployeeOnly(staffId)}
                  onAdjustmentSubmit={(payload) => {
                    // ดึงชื่อประเภทรายได้จาก dropdown
                    const el = document.getElementById(
                      "other-income-select",
                    ) as HTMLInputElement | null;
                    const selectedIncomeName =
                      el?.value || otherIncomeTypes[0]?.name || "OT";
                    // ส่ง payload (มี detail จาก Textarea) พร้อม nameIncome จาก dropdown
                    handleSalaryAdjustment(
                      payload,
                      "other",
                      selectedIncomeName,
                    );
                    setOtherIncomeDialogOpen(false);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ========= DIRECTORY (Employees & Payslip) ========= */}
        <TabsContent value="directory" className="space-y-4 md:space-y-6">
          <EmployeeOverview
            employees={employees}
            onGeneratePayslip={handleGeneratePayslip}
          />
        </TabsContent>
      </Tabs>
      <ToastContainer />
    </div>
  );
}
