"use client";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Info, Plus, Trash2, Edit3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";

import { SalaryAdjustmentForm } from "@/components/payroll/SalaryAdjustmentForm";
import { PayslipGenerator } from "@/components/payroll/PayslipGenerator";
import { EmployeeOverview } from "@/components/payroll/EmployeeOverview";
import { mockEmployees, mockAdjustments } from "@/data/mockPayrollData";
import type { Employee, SalaryAdjustment } from "@/types/payroll";

// -----------------------------
// Types
// -----------------------------
export type OtherIncomeType = { id: string; name: string; defaultAmount?: number };

// Helper: classify whether an adjustment is Other-Income based on known types
function isOtherIncome(adj: SalaryAdjustment, types: OtherIncomeType[]) {
  const set = new Set(types.map((t) => t.name));
  return set.has(adj.reason);
}

// Helper: timeframe filter
// mode: specific year (with selector) | last 5y | last 10y | all
 type TimeframeMode = "year" | "past-5" | "past-10" | "all";

function inTimeframeMode(dateISO: string, mode: TimeframeMode, selectedYear?: number): boolean {
  const d = new Date(dateISO);
  const now = new Date();
  if (mode === "year") {
    if (selectedYear == null) return true;
    return d.getFullYear() === selectedYear;
  }
  if (mode === "past-5") {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 5);
    return d >= from && d <= now;
  }
  if (mode === "past-10") {
    const from = new Date();
    from.setFullYear(from.getFullYear() - 10);
    return d >= from && d <= now;
  }
  return true; // all
}

// Metric for chart
 type ChartMetric = "salary" | "other" | "increase" | "decrease" | "net";

export default function PayrollPage() {
  // -----------------------------
  // State
  // -----------------------------
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>(mockAdjustments);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);

  // Filters – Overview Dashboard
  const [overviewEmployee, setOverviewEmployee] = useState<string | "all">("all");
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>("all");
  const allYearsSortedDesc = useMemo(
    () => Array.from(new Set(adjustments.map((a) => new Date(a.date).getFullYear()))).sort((a, b) => b - a),
    [adjustments]
  );
  const defaultYear = allYearsSortedDesc[0] ?? new Date().getFullYear();
  const [selectedYearForChart, setSelectedYearForChart] = useState<number>(defaultYear);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("net");

  // Adjustment-tab controls
  const [adjustmentType, setAdjustmentType] = useState<"salary" | "other">("salary");
  const [latestEmployeeOnly, setLatestEmployeeOnly] = useState<"none" | string>("none");

  // Other-Income types (editable via modal)
  const [otherIncomeTypes, setOtherIncomeTypes] = useState<OtherIncomeType[]>([
    { id: "ot", name: "OT" },
    { id: "late", name: "มาสาย" },
  ]);
  const [manageOpen, setManageOpen] = useState(false);

  // -----------------------------
  // Derived data – Dashboard & KPIs
  // -----------------------------
  const dashboardSlice = useMemo(() => {
    return adjustments.filter((adj) => {
      const empOk = overviewEmployee === "all" || adj.employeeId === overviewEmployee;
      const tfOk = inTimeframeMode(adj.date, timeframeMode, selectedYearForChart);
      return empOk && tfOk;
    });
  }, [adjustments, overviewEmployee, timeframeMode, selectedYearForChart]);

  const dashboardMetrics = useMemo(() => {
    const base = { totalNet: 0, salaryIncreases: 0, salaryDecreases: 0, otherIncome: 0 };
    return dashboardSlice.reduce((acc, adj) => {
      acc.totalNet += adj.amount;
      if (isOtherIncome(adj, otherIncomeTypes)) {
        acc.otherIncome += adj.amount;
      } else {
        if (adj.amount >= 0) acc.salaryIncreases += adj.amount;
        else acc.salaryDecreases += adj.amount; // negative sum
      }
      return acc;
    }, base);
  }, [dashboardSlice, otherIncomeTypes]);

  // Current salary KPI (sum or single employee)
  const currentSalaryKpi = useMemo(() => {
    if (overviewEmployee === "all") return employees.reduce((s, e) => s + e.currentSalary, 0);
    const emp = employees.find((e) => e.id === overviewEmployee);
    return emp?.currentSalary ?? 0;
  }, [overviewEmployee, employees]);

  // Chart data: depends on mode & metric
  const chartData = useMemo(() => {
    // Filter slice first by employee + timeframe
    const slice = adjustments.filter((a) =>
      (overviewEmployee === "all" || a.employeeId === overviewEmployee) && inTimeframeMode(a.date, timeframeMode, selectedYearForChart)
    );

    // helpers to pick value per metric
    const pickVal = (adj: SalaryAdjustment) => {
      const other = isOtherIncome(adj, otherIncomeTypes);
      if (chartMetric === "salary") return other ? 0 : adj.amount;
      if (chartMetric === "other") return other ? adj.amount : 0;
      if (chartMetric === "increase") return adj.amount >= 0 ? adj.amount : 0;
      if (chartMetric === "decrease") return adj.amount < 0 ? adj.amount : 0;
      return adj.amount; // net
    };

    if (timeframeMode === "year") {
      // 12 months
      const buckets = Array.from({ length: 12 }, (_, m) => ({ key: new Date(0, m).toLocaleString("th-TH", { month: "short" }), value: 0 }));
      slice.forEach((adj) => {
        const d = new Date(adj.date);
        const m = d.getMonth();
        buckets[m].value += pickVal(adj);
      });
      return buckets;
    }

    // past-5 / past-10 / all -> group by year
    const map = new Map<number, number>();
    slice.forEach((adj) => {
      const y = new Date(adj.date).getFullYear();
      map.set(y, (map.get(y) ?? 0) + pickVal(adj));
    });

    // ensure continuous years for past-5/10 (even if 0)
    let startYear: number | undefined;
    let endYear = new Date().getFullYear();
    if (timeframeMode === "past-5") startYear = endYear - 5 + 1;
    else if (timeframeMode === "past-10") startYear = endYear - 10 + 1;

    const years = startYear ? Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear! + i) : Array.from(map.keys()).sort((a, b) => a - b);
    return years.map((y) => ({ key: String(y), value: map.get(y) ?? 0 }));
  }, [adjustments, overviewEmployee, timeframeMode, selectedYearForChart, chartMetric, otherIncomeTypes]);

  // -----------------------------
  // Derived – Adjustment tab latest panel
  // -----------------------------
  const latestList = useMemo(() => {
    const target = adjustments
      .filter((a) => {
        const isOther = isOtherIncome(a, otherIncomeTypes);
        const matchType = adjustmentType === "salary" ? !isOther : isOther;
        const matchEmp = latestEmployeeOnly === "none" ? true : a.employeeId === latestEmployeeOnly;
        return matchType && matchEmp;
      })
      .slice(0, 10);
    return target;
  }, [adjustments, otherIncomeTypes, adjustmentType, latestEmployeeOnly]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleSalaryAdjustment = (adjustment: Omit<SalaryAdjustment, "id" | "date" | "type">) => {
    const newAdjustment: SalaryAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjustment.amount >= 0 ? "increase" : "decrease",
    };

    setEmployees((prev) =>
      prev.map((emp) => (emp.id === adjustment.employeeId ? { ...emp, currentSalary: emp.currentSalary + adjustment.amount } : emp))
    );

    setAdjustments((prev) => [newAdjustment, ...prev]);
  };

  const handleGeneratePayslip = (employee: Employee) => setSelectedEmployeeForPayslip(employee);
  const handleClosePayslip = () => setSelectedEmployeeForPayslip(null);

  // Other-income CRUD in modal
  const addOtherIncomeType = (name: string, defaultAmount?: number) => {
    const n = name.trim();
    if (!n) return;
    setOtherIncomeTypes((prev) => [{ id: crypto.randomUUID(), name: n, defaultAmount }, ...prev]);
  };
  const updateOtherIncomeType = (id: string, name: string, defaultAmount?: number) => {
    setOtherIncomeTypes((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.trim(), defaultAmount } : t)));
  };
  const removeOtherIncomeType = (id: string) => {
    setOtherIncomeTypes((prev) => prev.filter((t) => t.id !== id));
  };

  if (selectedEmployeeForPayslip) {
    return <PayslipGenerator employee={selectedEmployeeForPayslip} onClose={handleClosePayslip} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 md:ml-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ระบบ บริหารเงินเดือนพนักงาน</h1>
        <p className="text-muted-foreground">บริหารเงินเดือน และ รายได้อื่น ๆ พร้อมใบสลิป</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">เงินเดือนพนักงาน</TabsTrigger>
          <TabsTrigger value="adjustment">ปรับเงินเดือน/รายได้อื่น</TabsTrigger>
        </TabsList>

        {/* ---------------- OVERVIEW ---------------- */}
        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard controls */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">ภาพรวมการปรับ (Dashboard)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* พนักงาน */}
                <div className="space-y-2">
                  <Label>ดูพนักงาน</Label>
                  <select className="border p-2 rounded-md w-full" value={overviewEmployee} onChange={(e) => setOverviewEmployee(e.target.value as any)}>
                    <option value="all">พนักงานทั้งหมด</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* โหมดช่วงเวลา */}
                <div className="space-y-2">
                  <Label>ช่วงเวลา</Label>
                  <select className="border p-2 rounded-md w-full" value={timeframeMode} onChange={(e) => setTimeframeMode(e.target.value as TimeframeMode)}>
                    <option value="year">รายปี</option>
                    <option value="past-5">ย้อนหลัง 5 ปี</option>
                    <option value="past-10">ย้อนหลัง 10 ปี</option>
                    <option value="all">ทั้งหมด</option>
                  </select>
                </div>

                {/* เลือกปี (โชว์เมื่อโหมดปี) */}
                <div className="space-y-2">
                  <Label>เลือกปี</Label>
                  <select
                    className="border p-2 rounded-md w-full disabled:opacity-50"
                    disabled={timeframeMode !== "year"}
                    value={selectedYearForChart}
                    onChange={(e) => setSelectedYearForChart(parseInt(e.target.value))}
                  >
                    {allYearsSortedDesc.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* เลือก Metric */}
                <div className="space-y-2">
                  <Label>ดูข้อมูลในกราฟ</Label>
                  <select className="border p-2 rounded-md w-full" value={chartMetric} onChange={(e) => setChartMetric(e.target.value as ChartMetric)}>
                    <option value="salary">เงินเดือน</option>
                    <option value="other">รายได้อื่น</option>
                    <option value="increase">ปรับเพิ่ม</option>
                    <option value="decrease">ปรับลด</option>
                    <option value="net">รวมสุทธิ</option>
                  </select>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Kpi title="เงินเดือนปัจจุบัน" value={currentSalaryKpi} formatCurrency />
                <Kpi title="สุทธิ (ปรับทั้งหมด)" value={dashboardMetrics.totalNet} formatCurrency />
                <Kpi title="ปรับเพิ่มเงินเดือน" value={dashboardMetrics.salaryIncreases} formatCurrency />
                <Kpi title="ปรับลดเงินเดือน" value={dashboardMetrics.salaryDecreases} formatCurrency />
                <Kpi title="รายได้อื่นทั้งหมด" value={dashboardMetrics.otherIncome} formatCurrency />
              </div>

              {/* Chart */}
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {timeframeMode === "year" ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="มูลค่า" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="มูลค่า" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Existing employee list */}
          <EmployeeOverview employees={employees} onGeneratePayslip={handleGeneratePayslip} />
        </TabsContent>

        {/* ---------------- ADJUSTMENT ---------------- */}
        <TabsContent value="adjustment" className="space-y-6">
          <div className="space-y-4">
            <Label className="block">เลือกประเภทที่ต้องการปรับ:</Label>
            <select className="border p-2 rounded-md" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as any)}>
              <option value="salary">ปรับเงินเดือน</option>
              <option value="other">ปรับรายได้อื่น (เช่น OT, มาสาย)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form + other-income selector */}
            <Card className="space-y-4">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">ฟอร์ม{adjustmentType === "salary" ? "ปรับเงินเดือน" : "ปรับรายได้อื่น"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {adjustmentType === "other" && (
                  <div className="space-y-2">
                    <Label>เลือกรายได้อื่น</Label>
                    <div className="flex gap-2">
                      <select className="border p-2 rounded-md flex-1" id="other-income-select">
                        {otherIncomeTypes.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" title="จัดการรายการรายได้อื่น">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <ManageOtherIncomeModal
                          types={otherIncomeTypes}
                          onAdd={addOtherIncomeType}
                          onUpdate={updateOtherIncomeType}
                          onRemove={removeOtherIncomeType}
                        />
                      </Dialog>
                    </div>
                    <p className="text-xs text-muted-foreground">* รายการในดรอปดาวน์จะอัปเดตอัตโนมัติเมื่อเพิ่ม/แก้ไข/ลบ</p>
                    <Separator />
                  </div>
                )}

                {/* NOTE: If your SalaryAdjustmentForm supports prefill props, you can wire selected option via document.getElementById. */}
                <SalaryAdjustmentForm
                  employees={employees}
                  onAdjustmentSubmit={(payload) => {
                    // If adjusting other-income, force reason to selected dropdown value
                    if (adjustmentType === "other") {
                      const el = document.getElementById("other-income-select") as HTMLSelectElement | null;
                      const reason = el?.value || payload.reason;
                      handleSalaryAdjustment({ ...payload, reason });
                    } else {
                      handleSalaryAdjustment(payload);
                    }
                  }}
                  type={adjustmentType}
                />
              </CardContent>
            </Card>

            {/* Right: Latest list with employee selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">รายการล่าสุด ({adjustmentType === "salary" ? "เงินเดือน" : "รายได้อื่น"})</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">พนักงาน</Label>
                  <select className="border p-2 rounded-md" value={latestEmployeeOnly} onChange={(e) => setLatestEmployeeOnly(e.target.value)}>
                    <option value="none">— เลือกพนักงาน —</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {latestEmployeeOnly === "none" ? (
                <div className="p-4 border rounded-lg bg-card text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> กรุณาเลือกพนักงานเพื่อดูรายการล่าสุด
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {latestList.map((adjustment) => {
                    const employee = employees.find((emp) => emp.id === adjustment.employeeId);
                    return (
                      <div key={adjustment.id} className="p-3 border rounded-lg bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${adjustment.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {adjustment.amount >= 0 ? "+" : ""}฿{adjustment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">{new Date(adjustment.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -----------------------------
// Components
// -----------------------------
function Kpi({ title, value, formatCurrency }: { title: string; value: number; formatCurrency?: boolean }) {
  const display = formatCurrency ? `฿${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : value.toString();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{display}</div>
      </CardContent>
    </Card>
  );
}

function ManageOtherIncomeModal({
  types,
  onAdd,
  onUpdate,
  onRemove,
}: {
  types: OtherIncomeType[];
  onAdd: (name: string, defaultAmount?: number) => void;
  onUpdate: (id: string, name: string, defaultAmount?: number) => void;
  onRemove: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<string>("");
  const [editing, setEditing] = useState<Record<string, { name: string; defaultAmount?: number }>>({});

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>จัดการรายการรายได้อื่น</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="ชื่อรายการ เช่น OT" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="จำนวนเริ่มต้น (ไม่บังคับ)" type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
          <Button
            onClick={() => {
              onAdd(newName, newAmount === "" ? undefined : Number(newAmount));
              setNewName("");
              setNewAmount("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> เพิ่ม
          </Button>
        </div>
        <Separator />
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {types.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>}
          {types.map((t) => {
            const isEditing = !!editing[t.id];
            const val = editing[t.id] ?? { name: t.name, defaultAmount: t.defaultAmount };
            return (
              <div key={t.id} className="flex items-center gap-2 border rounded-lg p-2">
                {isEditing ? (
                  <>
                    <Input className="flex-1" value={val.name} onChange={(e) => setEditing((prev) => ({ ...prev, [t.id]: { ...val, name: e.target.value } }))} />
                    <Input
                      className="w-40"
                      type="number"
                      value={val.defaultAmount ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [t.id]: { ...val, defaultAmount: e.target.value === "" ? undefined : Number(e.target.value) } }))
                      }
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onUpdate(t.id, val.name, val.defaultAmount);
                        setEditing((prev) => {
                          const cp = { ...prev };
                          delete cp[t.id];
                          return cp;
                        });
                      }}
                    >
                      บันทึก
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-medium">{t.name}</div>
                      {t.defaultAmount !== undefined && (
                        <div className="text-xs text-muted-foreground">ค่าเริ่มต้น: ฿{t.defaultAmount.toLocaleString()}</div>
                      )}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setEditing((prev) => ({ ...prev, [t.id]: { name: t.name, defaultAmount: t.defaultAmount } }))}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onRemove(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <DialogFooter>
        <DialogTrigger asChild>
          <Button variant="secondary">ปิด</Button>
        </DialogTrigger>
      </DialogFooter>
    </DialogContent>
  );
}
