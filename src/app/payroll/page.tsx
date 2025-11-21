"use client";
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Info,
  Pencil,
  Plus,
  Trash2,
  Edit3,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import DeleteConfirmButton from "../../components/DeleteButton";
import { SalaryAdjustmentForm } from "../../components/payroll/SalaryAdjustmentForm";
import { PayslipGenerator } from "../../components/payroll/PayslipGenerator";
import { EmployeeOverview } from "../../components/payroll/EmployeeOverview";
import { mockEmployees, mockAdjustments } from "../../data/mockPayrollData";
import type { Employee, SalaryAdjustment } from "../../types/payroll";
import { ToastContainer, toast } from "react-toastify";
/* =========================
   Types & Helpers
========================= */
export type OtherIncomeType = {
  id: string;
  name: string;
  defaultAmount?: number;
  types?: string;
};

function isOtherIncome(adj: SalaryAdjustment, types: OtherIncomeType[]) {
  if (!adj.detail) return false;
  const detailLower = adj.detail.toLowerCase().trim();
  return types.some((t) => detailLower.includes(t.name.toLowerCase().trim()));
}

type TimeframeMode = "year" | "past-5" | "past-10" | "all";
function inTimeframeMode(
  dateISO: string,
  mode: TimeframeMode,
  selectedYear?: number
): boolean {
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
  return true;
}

type ChartMetric = "salary" | "other" | "increase" | "decrease" | "net";

/* =========================
   Page
========================= */
export default function PayrollPage() {
  /* State */
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [adjustments, setAdjustments] =
    useState<SalaryAdjustment[]>(mockAdjustments);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] =
    useState<Employee | null>(null);

  // Overview filters
  const [overviewEmployee, setOverviewEmployee] = useState<string | "all">(
    "all"
  );
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>("all");
  const allYearsSortedDesc = useMemo(
    () =>
      Array.from(
        new Set(adjustments.map((a) => new Date(a.date).getFullYear()))
      ).sort((a, b) => b - a),
    [adjustments]
  );
  const defaultYear = allYearsSortedDesc[0] ?? new Date().getFullYear();
  const [selectedYearForChart, setSelectedYearForChart] =
    useState<number>(defaultYear);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("net");

  // Adjustment tab
  const [adjustmentType, setAdjustmentType] = useState<"salary" | "other">(
    "salary"
  );
  const [latestEmployeeOnly, setLatestEmployeeOnly] = useState<"none" | string>(
    "none"
  );

  // Other income catalog
  const [otherIncomeTypes, setOtherIncomeTypes] = useState<OtherIncomeType[]>([
    { id: "ot", name: "OT", types: "increase" },
    { id: "late", name: "มาสาย", types: "decrease" },
  ]);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then((data: Employee[]) => {
        const withName = data.map((e) => ({
          ...e,
          name: e.user?.name ?? e.staffName ?? "",
        }));
        setEmployees(withName);
      })
      .catch((err) => console.error("Error fetching employees:", err));
    fetch("/api/typeStaffIncome")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch typeStaffIncome");
        return res.json();
      })
      .then((data: OtherIncomeType[]) => {
        const mapped: OtherIncomeType[] = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          defaultAmount: Number(item.defaultAmount),
          types: item.types,
        }));
        setOtherIncomeTypes(mapped);
      })
      .catch((err) => {
        console.error("Error fetching typeStaffIncome:", err);
      });
  }, []);

  /* Derived – Dashboard */
  const dashboardSlice = useMemo(() => {
    return adjustments.filter((adj) => {
      const empOk =
        overviewEmployee === "all" || adj.staffId === overviewEmployee;
      const tfOk = inTimeframeMode(
        adj.date,
        timeframeMode,
        selectedYearForChart
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
        else acc.salaryDecreases += adj.amount; // negative
      }
      return acc;
    }, base);
  }, [dashboardSlice, otherIncomeTypes]);
  const isDeduction = (name?: string, detail?: string) => {
    const n = name ?? "";
    const d = detail ?? "";
    // เดาแบบง่ายๆ จาก prefix/code และคำสำคัญภาษาไทย
    return (
      /^(DEDUCT|PENALTY|FINE|WITHHOLD)/i.test(n) ||
      /(หัก|ค่าปรับ|ปรับเงิน|ผิดระเบียบ)/.test(d)
    );
  };

  useEffect(() => {
    loadAdjustments();
  }, []);

  // ดูค่า adjustments ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    console.log("adjustments:", adjustments);
    console.log("latestList:", latestList);
    console.log("employee: ", employees);
  }, [adjustments]);

  // ดูค่า latestList ทุกครั้งที่เปลี่ยน

  const mapIncome = (r): SalaryAdjustment => ({
    id: String(r.id),
    staffId: String(r.staffId),
    amount: Number(r.amount) ?? 0,
    detail: r.detail ?? r.name ?? "",
    date: new Date(r.date ?? r.createdAt ?? Date.now())
      .toISOString()
      .slice(0, 10),
    type: isDeduction(r.name, r.detail) ? "decrease" : "increase",
  });

  const mapSalary = (r): SalaryAdjustment => ({
    id: String(r.id),
    staffId: String(r.staffId),
    amount: Number(r.amount) ?? 0,
    detail: r.detail ?? "ปรับเงินเดือน",
    date: new Date(r.effectiveDate ?? r.createdAt ?? Date.now())
      .toISOString()
      .slice(0, 10),
    type: "increase", //แต่ก่อนทีใช้เป็น type: "salary", แต่มันไม่มีtypeนี้ใน SalaryAdjustment นะงับ เราเลยแก้ให้แล้วกลับมาแก้ด้วยเม้นไว้เผื่อลืมบอกแล้วซักวันกลับมาเจอยังไงทีก็ตั้งสังเกตบ้างแหละว่าทำไมคอมเม้นยาวขนาดนี้
  });

  // โหลดตาม adjustmentType
  const loadAdjustments = async (signal?: AbortSignal) => {
    const isSalary = adjustmentType === "salary";
    const url = isSalary ? "/api/staffSalary" : "/api/staffIncome";

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(
        `Fetch failed (${res.status}): ${msg || "Unknown error"}`
      );
    }
    console.log("Fetched adjustments:", isSalary, res);

    const data: SalaryAdjustment[] = await res.json();
    const mapped = (isSalary ? data.map(mapSalary) : data.map(mapIncome)).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setAdjustments(mapped);
  };

  // เรียกใช้ให้รีเฟรชทุกครั้งที่ adjustmentType เปลี่ยน
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        await loadAdjustments(ac.signal);
      } catch (e) {
        console.error(e);
        setAdjustments([]);
      }
    })();
    return () => ac.abort();
  }, [adjustmentType]);

  const currentSalaryKpi = useMemo(() => {
    if (overviewEmployee === "all")
      return employees.reduce((s, e) => s + e.currentSalary, 0);
    const emp = employees.find((e) => String(e.id) === String(overviewEmployee));
    return emp?.currentSalary ?? 0;
  }, [overviewEmployee, employees]);

  const chartData = useMemo(() => {
    const slice = adjustments.filter(
      (a) =>
        (overviewEmployee === "all" || a.staffId === overviewEmployee) &&
        inTimeframeMode(a.date, timeframeMode, selectedYearForChart)
    );

    const pickVal = (adj: SalaryAdjustment) => {
      const other = isOtherIncome(adj, otherIncomeTypes);
      if (chartMetric === "salary") return other ? 0 : adj.amount;
      if (chartMetric === "other") return other ? adj.amount : 0;
      if (chartMetric === "increase") return adj.amount >= 0 ? adj.amount : 0;
      if (chartMetric === "decrease") return adj.amount < 0 ? adj.amount : 0;
      return adj.amount;
    };

    if (timeframeMode === "year") {
      const buckets = Array.from({ length: 12 }, (_, m) => ({
        key: new Date(0, m).toLocaleString("th-TH", {
          month: "short",
        }),
        value: 0,
      }));
      slice.forEach((adj) => {
        const d = new Date(adj.date);
        buckets[d.getMonth()].value += pickVal(adj);
      });
      return buckets;
    }

    const map = new Map<number, number>();
    slice.forEach((adj) => {
      const y = new Date(adj.date).getFullYear();
      map.set(y, (map.get(y) ?? 0) + pickVal(adj));
    });

    let startYear: number | undefined;
    const endYear = new Date().getFullYear();
    if (timeframeMode === "past-5") startYear = endYear - 5 + 1;
    else if (timeframeMode === "past-10") startYear = endYear - 10 + 1;

    const years = startYear
      ? Array.from(
          { length: endYear - startYear + 1 },
          (_, i) => startYear! + i
        )
      : Array.from(map.keys()).sort((a, b) => a - b);

    return years.map((y) => ({ key: String(y), value: map.get(y) ?? 0 }));
  }, [
    adjustments,
    overviewEmployee,
    timeframeMode,
    selectedYearForChart,
    chartMetric,
    otherIncomeTypes,
  ]);

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
  const handleSalaryAdjustment = (
    adjustment: Omit<SalaryAdjustment, "id" | "date" | "type">
  ) => {
    const newAdjustment: SalaryAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjustment.amount >= 0 ? "increase" : "decrease",
    };
    if (adjustmentType === "other") {
      fetch("/api/staffIncome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffId: Number(newAdjustment?.staffId), // "1" -> 1
          amount: Number(newAdjustment?.amount), // amount -> Price
          detail: newAdjustment?.detail,
          name: "OT-005",
        }),
      })
        .then(async (res) => {
          const text = await res.text();
          if (!res.ok) throw new Error(`${res.status} ${text}`);
          return JSON.parse(text);
        })
        .then(() => {
          toast.success(`เพิ่มรายได้พนักงานสำเร็จ`, {
            position: "bottom-right",
          });
        })
        .catch((err) => {
          toast.error(`พบข้อผิดพลาด: ${err}`, {
            position: "bottom-right",
          });
        });
    }
    if (adjustmentType === "salary") {
      fetch(`/api/staff/${newAdjustment.staffId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ให้ browser แนบ cookie session อัตโนมัติ
        body: JSON.stringify({
          currentSalary: Number(newAdjustment.amount),
        }),
      })
        .then(async (res) => {
          const text = await res.text();
          if (!res.ok) throw new Error(`${res.status} ${text}`);
          return JSON.parse(text);
        })
        .then(() => {
          toast.success(`อัพเดตรายได้พนักงานสำเร็จ`, {
            position: "bottom-right",
          });
        })

        .catch((err) => {
          toast.error(`พบข้อผิดพลาด อัพเดตรายได้พนักงานไม่สำเร็จ: ${err}`, {
            position: "bottom-right",
          });
        });
      fetch("/api/staffSalary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ให้ browser ส่ง cookie next-auth.session-token อัตโนมัติ
        body: JSON.stringify({
          staffId: Number(newAdjustment.staffId), // แปลง staffId → staffId
          amount: newAdjustment.amount,
          detail: newAdjustment.detail,
        }),
      })
        .then(async (res) => {
          const text = await res.text();
          if (!res.ok) throw new Error(`${res.status} ${text}`);
          return JSON.parse(text);
        })
        .then(() => {
          toast.success(`อัพเดตรายได้พนักงานสำเร็จ`, {
            position: "bottom-right",
          });
        })
        .catch((err) => {
          toast.error(`พบข้อผิดพลาด: ${err}`, {
            position: "bottom-right",
          });
        });
    }
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === adjustment.staffId
          ? {
              ...emp,
              currentSalary: emp.currentSalary + adjustment.amount,
            }
          : emp
      )
    );
    setAdjustments((prev) => [newAdjustment, ...prev]);
  };

  const handleGeneratePayslip = (employee: Employee) =>
    setSelectedEmployeeForPayslip(employee);
  const handleClosePayslip = () => setSelectedEmployeeForPayslip(null);

  // CRUD other income types
  const inferTypesFromAmount = (
    amt: number | undefined
  ): "increase" | "decrease" => ((amt ?? 0) < 0 ? "decrease" : "increase");

  // API add
  const addOtherIncomeType = async (
    name: string,
    defaultAmount?: number,
    types?: "increase" | "decrease"
  ) => {
    const body = {
      name: name.trim(),
      amount: Number(defaultAmount ?? 0),
      types: types ?? inferTypesFromAmount(defaultAmount),
    };

    const res = await fetch("/api/typeStaffIncome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // แนบ cookie อัตโนมัติ
      body: JSON.stringify(body),
    });
    if (res.ok)
      toast.success("เพิ่มรายได้พนักงานสำเร็จ", {
        position: "bottom-right",
      });
    if (!res.ok) throw new Error(await res.text());
    const created = await res.json();
    return {
      id: String(created.id),
      name: created.name,
      defaultAmount: Number(created.amount),
      types: created.types,
    } as OtherIncomeType;
  };

  // API update
  const updateOtherIncomeType = async (
    id: string,
    name: string,
    defaultAmount?: number,
    types?: "increase" | "decrease"
  ) => {
    const body = {
      name: name.trim(),
      amount: defaultAmount,
      types: types ?? inferTypesFromAmount(defaultAmount),
    };

    const res = await fetch(`/api/typeStaffIncome/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok)
      toast.success("อัพเดตรายได้พนักงานสำเร็จ", {
        position: "bottom-right",
      });
    if (!res.ok) throw new Error(await res.text());
    const updated = await res.json();
    return {
      name: updated.name,
      defaultAmount: Number(updated.amount),
      types: updated.types,
    } as OtherIncomeType;
  };

  // API remove
  const removeOtherIncomeType = async (id: string) => {
    const res = await fetch(`/api/typeStaffIncome/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok)
      toast.success("ลบรายได้พนักงานสำเร็จ", {
        position: "bottom-right",
      });
    if (!res.ok) {
      toast.error("กรุณา รีโหลดหน้าใหม่", { position: "bottom-right" });
    }
    return true;
  };
  const deleteStaffIncome = async (id: string | number) => {
    try {
      const res = await fetch(`/api/staffIncome/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      toast.success("ลบ ผู้ใช้งานสำเร็จ", {
        position: "bottom-right",
      });
    } catch (error) {
      toast.error(`ลบ ผู้ใช้งานไม่สำเร็จ: ${error}`, {
        position: "bottom-right",
      });
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

  /* =========================
     UI
  ========================= */
  return (
    <div className="container mx-auto p-6 md:ml-24 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          ระบบบริหารเงินเดือนพนักงาน
        </h1>
        <p className="text-muted-foreground mt-2">
          บริหารเงินเดือน รายได้อื่น ๆ และออกสลิปแบบครบจบในที่เดียว
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:scale-110 data-[state=active]:shadow-sm rounded-lg"
          >
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger
            value="adjustment"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:scale-110 data-[state=active]:shadow-sm rounded-lg"
          >
            ปรับเงินเดือน/รายได้อื่น
          </TabsTrigger>
          <TabsTrigger
            value="directory"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:scale-110 data-[state=active]:shadow-sm rounded-lg"
          >
            รายชื่อ & สลิป
          </TabsTrigger>
        </TabsList>

        {/* ========= OVERVIEW ========= */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ภาพรวมรายได้พนักงาน (Dashboard)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>พนักงาน</Label>
                  <Select
                    value={String(overviewEmployee)}
                    onValueChange={(v) => setOverviewEmployee(v as string | "all")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกพนักงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">พนักงานทั้งหมด</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={String(emp.id)}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ช่วงเวลา</Label>
                  <Select
                    value={timeframeMode}
                    onValueChange={(v: TimeframeMode) => setTimeframeMode(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกช่วงเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">รายปี</SelectItem>
                      <SelectItem value="past-5">ย้อนหลัง 5 ปี</SelectItem>
                      <SelectItem value="past-10">ย้อนหลัง 10 ปี</SelectItem>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ปี (สำหรับโหมดรายปี)</Label>
                  <Select
                    value={String(selectedYearForChart)}
                    onValueChange={(v) => setSelectedYearForChart(parseInt(v))}
                    disabled={timeframeMode !== "year"}
                  >
                    <SelectTrigger className="w-full disabled:opacity-60">
                      <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {allYearsSortedDesc.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>เมตริกกราฟ</Label>
                  <Select
                    value={chartMetric}
                    onValueChange={(v: ChartMetric) => setChartMetric(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกเมตริก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">เงินเดือน</SelectItem>
                      <SelectItem value="other">รายได้อื่น</SelectItem>
                      <SelectItem value="increase">ปรับเพิ่ม</SelectItem>
                      <SelectItem value="decrease">ปรับลด</SelectItem>
                      <SelectItem value="net">รวมสุทธิ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Kpi
                  icon={<Wallet className="h-5 w-5 text-blue-500" />}
                  title="เงินเดือนปัจจุบัน"
                  value={currentSalaryKpi}
                  colorBackground={"bg-blue-200"}
                  formatCurrency
                />
                <Kpi
                  icon={<PiggyBank className="h-5 w-5 text-pink-400" />}
                  title="สุทธิ (ปรับทั้งหมด)"
                  value={dashboardMetrics.totalNet}
                  colorBackground={"bg-pink-200"}
                  formatCurrency
                />
                <Kpi
                  icon={<TrendingUp className="h-5 w-5 text-green-400" />}
                  title="ปรับเพิ่มเงินเดือน"
                  value={dashboardMetrics.salaryIncreases}
                  colorBackground={"bg-green-200"}
                  formatCurrency
                />
                <Kpi
                  icon={<TrendingDown className="h-5 w-5 text-red-500" />}
                  title="ปรับลดเงินเดือน"
                  value={dashboardMetrics.salaryDecreases}
                  colorBackground={"bg-red-200"}
                  formatCurrency
                />
                <Kpi
                  icon={<PiggyBank className="h-5 w-5 text-purple-500" />}
                  title="รายได้อื่นทั้งหมด"
                  value={dashboardMetrics.otherIncome}
                  colorBackground={"bg-purple-200"}
                  formatCurrency
                />
              </div>

              {/* Chart */}
              <div className="h-80 w-full rounded-xl border bg-card">
                <ResponsiveContainer width="100%" height="100%">
                  {timeframeMode === "year" ? (
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="key" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="มูลค่า" />
                    </BarChart>
                  ) : (
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
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
        </TabsContent>

        {/* ========= ADJUSTMENT ========= */}
        <TabsContent value="adjustment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Form */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {adjustmentType === "salary"
                      ? "ฟอร์มปรับเงินเดือน"
                      : "ฟอร์มปรับรายได้อื่น"}
                  </CardTitle>
                  <Badge variant="secondary" className="rounded-full">
                    {adjustmentType === "salary"
                      ? "ปรับเงินเดือน"
                      : "รายได้อื่น"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>เลือกประเภทที่ต้องการปรับ</Label>
                    <Select
                      value={adjustmentType}
                      onValueChange={(v: "salary" | "other") =>
                        setAdjustmentType(v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">ปรับเงินเดือน</SelectItem>
                        <SelectItem value="other">
                          ปรับรายได้อื่น (เช่น OT, มาสาย)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {adjustmentType === "other" && (
                    <div className="space-y-2">
                      <Label>เลือกรายการรายได้อื่น</Label>
                      <div className="flex gap-2">
                        <Select
                          defaultValue={otherIncomeTypes[0]?.name ?? "OT"}
                          onValueChange={(v) => {
                            const el = document.getElementById(
                              "other-income-select"
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
                            // ⬇️ ไม่เปลี่ยน signature ของ modal: ส่งแค่ (name, defaultAmount?)
                            onAdd={async (name, amount) => {
                              try {
                                const created = await addOtherIncomeType(
                                  name,
                                  amount
                                );
                                setOtherIncomeTypes((prev) => [
                                  created,
                                  ...prev,
                                ]);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            onUpdate={async (id, name, amount) => {
                              try {
                                const updated = await updateOtherIncomeType(
                                  id,
                                  name,
                                  amount
                                );
                                setOtherIncomeTypes((prev) =>
                                  prev.map((t) => (t.id === id ? updated : t))
                                );
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            onRemove={async (id) => {
                              try {
                                await removeOtherIncomeType(id);
                                setOtherIncomeTypes((prev) =>
                                  prev.filter((t) => t.id !== id)
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
                        * เพิ่ม/แก้ไข/ลบ รายการได้ผ่านปุ่ม “แก้ไข”
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <SalaryAdjustmentForm
                  employees={employees}
                  onAdjustmentSubmit={(payload) => {
                    if (adjustmentType === "other") {
                      const el = document.getElementById(
                        "other-income-select"
                      ) as HTMLInputElement | null;
                      const detail = el?.value || payload.detail;
                      handleSalaryAdjustment({ ...payload, detail });
                    } else {
                      handleSalaryAdjustment(payload);
                    }
                  }}
                  type={adjustmentType}
                />
              </CardContent>
            </Card>

            {/* Right column: Latest */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">รายการล่าสุด</CardTitle>
                  <Badge variant="outline" className="rounded-full capitalize">
                    {adjustmentType === "salary" ? "เงินเดือน" : "รายได้อื่น"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>พนักงาน</Label>
                  <Select
                    value={latestEmployeeOnly}
                    onValueChange={(v) => setLatestEmployeeOnly(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกพนักงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        ทั้งหมด (แนะนำเลือกพนักงานเพื่อความละเอียด)
                      </SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {latestEmployeeOnly === "none" ? (
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    กรุณาเลือกพนักงานเพื่อดูรายการล่าสุดแบบละเอียด
                  </div>
                ) : latestList.length === 0 ? (
                  <EmptyState message="ยังไม่มีรายการปรับล่าสุดสำหรับพนักงานนี้" />
                ) : (
                  <ScrollArea className="h-96 rounded-xl border bg-card">
                    <div className="p-2 space-y-2">
                      {latestList.map((adjustment) => {
                        const employee = employeeById.get(
                          String(adjustment.staffId)
                        );
                        const positive = adjustment.amount >= 0;
                        return (
                          <div
                            key={adjustment.id}
                            className="group rounded-xl border bg-background hover:bg-muted/50 transition-colors p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {employee?.name}
                                  </p>
                                  <Badge
                                    className="rounded-full"
                                    variant={
                                      isOtherIncome(
                                        adjustment,
                                        otherIncomeTypes
                                      )
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {isOtherIncome(adjustment, otherIncomeTypes)
                                      ? "รายได้อื่น"
                                      : "เงินเดือน"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {adjustment.detail}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`font-semibold ${
                                    positive
                                      ? "text-green-600 dark:text-green-500"
                                      : "text-red-600 dark:text-red-500"
                                  }`}
                                >
                                  {positive ? "+" : ""}฿
                                  {adjustment.amount.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    adjustment.date
                                  ).toLocaleDateString()}
                                </p>
                                {isOtherIncome(adjustment, otherIncomeTypes) ? (
                                  <DeleteConfirmButton
                                    onConfirm={() =>
                                      deleteStaffIncome(adjustment.id)
                                    }
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========= DIRECTORY (Employees & Payslip) ========= */}
        <TabsContent value="directory" className="space-y-6">
          <EmployeeOverview
            employees={employees}
            onGeneratePayslip={handleGeneratePayslip}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =========================
   Reusable Components
========================= */

function Kpi({
  title,
  value,
  formatCurrency,
  icon,
  gradient = "from-blue/60 to-blue/30",
  colorBackground,
}: {
  title: string;
  value: number;
  formatCurrency?: boolean;
  icon?: React.ReactNode;
  gradient?: string;
  colorBackground?: string;
}) {
  const display = formatCurrency
    ? `฿${value.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`
    : value.toString();

  return (
    <div className="rounded-2xl border bg-card p-0 overflow-hidden">
      <div className={`h-2 w-full bg-gradient-to-r ${gradient}`} aria-hidden />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={`rounded-full shadow-2xl shadow-black p-2 ${colorBackground}`}
          >
            {icon && <div className="text-muted-foreground/80">{icon}</div>}
          </div>
        </div>
        <div className="mt-2 text-2xl font-semibold text-foreground">
          {display}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
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
  const [editing, setEditing] = useState<
    Record<string, { name: string; defaultAmount?: number }>
  >({});
  const [valueTypeStaffIncome, setValueTypeStaffIncome] = useState("");
  const canAdd =
    newName.trim() !== "" && // มีชื่อ
    newAmount !== "" && // มีจำนวน
    (valueTypeStaffIncome === "increase" ||
      valueTypeStaffIncome === "decrease"); // เลือกประเภทแล้ว

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>จัดการรายการรายได้อื่น</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        {/* Add */}
        <div className="flex gap-2">
          <Input
            placeholder="ชื่อรายการ เช่น OT"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            placeholder="จำนวนเริ่มต้น (ไม่บังคับ)"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <Select
            value={valueTypeStaffIncome}
            onValueChange={(v: "increase" | "decrease") =>
              setValueTypeStaffIncome(v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="increase">เพิ่มรายได้</SelectItem>
              <SelectItem value="decrease">ลดรายได้</SelectItem>
            </SelectContent>
          </Select>
          <div></div>
          <Button
            disabled={!canAdd}
            onClick={() => {
              if (!canAdd) return;
              onAdd(newName, Number(newAmount));
              setNewName("");
              setNewAmount("");
              setValueTypeStaffIncome("");
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            เพิ่ม
          </Button>
        </div>

        <Separator />

        {/* List */}
        <ScrollArea className="h-80 rounded-md border">
          <div className="p-2 space-y-2">
            {types.length === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
            )}
            {types.map((t) => {
              const isEditing = !!editing[t.id];
              const val = editing[t.id] ?? {
                name: t.name,
                defaultAmount: t.defaultAmount,
              };
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-2 border rounded-lg p-2 bg-background"
                >
                  {isEditing ? (
                    <>
                      <Input
                        className="flex-1"
                        value={val.name}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: { ...val, name: e.target.value },
                          }))
                        }
                      />
                      <Input
                        className="w-40"
                        type="number"
                        value={val.defaultAmount ?? ""}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: {
                              ...val,
                              defaultAmount:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          }))
                        }
                      />
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const nameOk = val.name.trim() !== "";
                          const amtOk =
                            typeof val.defaultAmount === "number" &&
                            !Number.isNaN(val.defaultAmount);
                          if (!nameOk || !amtOk) return; // ยังกรอกไม่ครบ ก็ไม่ทำอะไร

                          onUpdate(t.id, val.name.trim(), val.defaultAmount);
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
                          <div className="text-xs text-muted-foreground">
                            ค่าเริ่มต้น: ฿{t.defaultAmount.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [t.id]: {
                              name: t.name,
                              defaultAmount: t.defaultAmount,
                            },
                          }))
                        }
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onRemove(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <ToastContainer />
      </div>

      <DialogFooter>
        <DialogTrigger asChild>
          <Button variant="secondary">ปิด</Button>
        </DialogTrigger>
      </DialogFooter>
    </DialogContent>
  );
}
