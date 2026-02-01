"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
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
  DollarSign,
  FileText,
  Briefcase,
  ListChecks,
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
import { EmployeeDirectory } from "../../components/payroll/EmployeeDirectory";
import { EmployeeOverview } from "../../components/payroll/EmployeeOverview";
import { KPIStatCard } from "../../components/saleDashboard/kpi-stat-card";
import { mockEmployees, mockAdjustments } from "../../data/mockPayrollData";
import type { Employee, SalaryAdjustment } from "../../types/payroll";
import { ToastContainer, toast } from "react-toastify";
import { Loader2 } from "lucide-react";
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
  // ถ้ามี nameIncome แสดงว่าเป็นรายได้อื่นจาก staffIncome table
  if (adj.nameIncome) {
    return true;
  }
  // fallback: เช็คจาก detail ถ้าไม่มี nameIncome
  if (!adj.detail) return false;
  const detailLower = adj.detail.toLowerCase().trim();
  return types.some((t) => detailLower.includes(t.name.toLowerCase().trim()));
}

type TimeframeMode = "year" | "past-5" | "past-10" | "all";
function inTimeframeMode(
  dateISO: string,
  mode: TimeframeMode,
  selectedYear?: number,
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
  const [loading, setLoading] = useState(true);

  // Overview filters
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

  // Adjustment tab
  const [adjustmentType, setAdjustmentType] = useState<"salary" | "other">(
    "salary",
  );
  const [latestEmployeeOnly, setLatestEmployeeOnly] = useState<"none" | string>(
    "none",
  );

  // Other income catalog
  const [otherIncomeTypes, setOtherIncomeTypes] = useState<OtherIncomeType[]>([
    { id: "ot", name: "OT", types: "increase" },
    { id: "late", name: "มาสาย", types: "decrease" },
  ]);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/staff")
        .then((res) => res.json())
        .then((data: Employee[]) => {
          const withName = data.map((e) => ({
            ...e,
            name: e.user?.name ?? e.staffName ?? "",
          }));
          setEmployees(withName);
        }),
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
        }),
    ])
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

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

  // ดูค่า adjustments ทุกครั้งที่เปลี่ยน
  useEffect(() => {
    console.log("adjustments:", adjustments);
    console.log("latestList:", latestList);
    console.log("employee: ", employees);
  }, [adjustments]);

  // ดูค่า latestList ทุกครั้งที่เปลี่ยน

  const mapIncome = (r: SalaryAdjustment): SalaryAdjustment => ({
    id: String(r.id),
    staffId: String(r.staffId),
    amount: Number(r.amount) ?? 0,
    detail: r.detail ?? r.name ?? "",
    nameIncome: r.nameIncome || r.name, // เก็บ nameIncome จาก API
    date: new Date(r.date ?? r.createdAt ?? Date.now())
      .toISOString()
      .slice(0, 10),
    type: isDeduction(r.name, r.detail) ? "decrease" : "increase",
  });

  const mapSalary = (r: SalaryAdjustment): SalaryAdjustment => ({
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
        `Fetch failed (${res.status}): ${msg || "Unknown error"}`,
      );
    }
    console.log("Fetched adjustments:", isSalary, res);

    const data: SalaryAdjustment[] = await res.json();
    const mapped = (isSalary ? data.map(mapSalary) : data.map(mapIncome)).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setAdjustments(mapped);
  };

  // เรียกใช้ให้รีเฟรชทุกครั้งที่ adjustmentType เปลี่ยน
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        await loadAdjustments(ac.signal);
      } catch (e: any) {
        // ไม่ต้อง log error ถ้าเป็นการ abort ปกติ
        if (e?.name !== "AbortError" && !ac.signal.aborted) {
          console.error(e);
        }
        if (!ac.signal.aborted) {
          setAdjustments([]);
        }
      }
    })();
    return () => ac.abort();
  }, [adjustmentType]);

  const currentSalaryKpi = useMemo(() => {
    if (overviewEmployee === "all")
      return employees.reduce((s, e) => s + e.currentSalary, 0);
    const emp = employees.find(
      (e) => String(e.id) === String(overviewEmployee),
    );
    return emp?.currentSalary ?? 0;
  }, [overviewEmployee, employees]);

  const chartData = useMemo(() => {
    const slice = adjustments.filter(
      (a) =>
        (overviewEmployee === "all" || a.staffId === overviewEmployee) &&
        inTimeframeMode(a.date, timeframeMode, selectedYearForChart),
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
          (_, i) => startYear! + i,
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
  const handleSalaryAdjustment = async (
    adjustment: Omit<SalaryAdjustment, "id" | "date" | "type">,
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
    if (adjustmentType === "other") {
      fetch("/api/staffIncome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffId: Number(newAdjustment?.staffId), // "1" -> 1
          amount: amountNum,
          detail: newAdjustment?.detail, // เหตุผลจาก Textarea
          nameIncome: nameIncome || otherIncomeTypes[0]?.name || "OT", // ชื่อประเภทจาก dropdown
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
      try {
        const salaryRes = await fetch(`/api/staff/${newAdjustment.staffId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        const salaryText = await salaryRes.text();
        if (!salaryRes.ok) throw new Error(`${salaryRes.status} ${salaryText}`);
        const salaryData = JSON.parse(salaryText);
        const currentSalary = Number(salaryData.currentSalary) || 0;
        const updatedSalary = currentSalary + amountNum;

        const patchRes = await fetch(`/api/staff/${newAdjustment.staffId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ให้ browser แนบ cookie session อัตโนมัติ
          body: JSON.stringify({
            currentSalary: updatedSalary,
          }),
        });
        const patchText = await patchRes.text();
        if (!patchRes.ok) throw new Error(`${patchRes.status} ${patchText}`);
        JSON.parse(patchText);

        toast.success(`อัพเดตรายได้พนักงานสำเร็จ`, {
          position: "bottom-right",
        });
      } catch (err) {
        toast.error(`พบข้อผิดพลาด อัพเดตรายได้พนักงานไม่สำเร็จ: ${err}`, {
          position: "bottom-right",
        });
        return;
      }

      try {
        const res = await fetch("/api/staffSalary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // ให้ browser ส่ง cookie next-auth.session-token อัตโนมัติ
          body: JSON.stringify({
            staffId: Number(newAdjustment.staffId), // แปลง staffId → staffId
            amount: Math.max(0, amountNum),
            detail: newAdjustment.detail,
          }),
        });
        const text = await res.text();
        if (!res.ok) throw new Error(`${res.status} ${text}`);
        JSON.parse(text);
        toast.success(`อัพเดตรายได้พนักงานสำเร็จ`, {
          position: "bottom-right",
        });
      } catch (err) {
        toast.error(`พบข้อผิดพลาด: ${err}`, {
          position: "bottom-right",
        });
      }

      // อัพเดต currentSalary ใน state เฉพาะตอนปรับเงินเดือน
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === Number(adjustment.staffId)
            ? {
                ...emp,
                currentSalary: emp.currentSalary + amountNum,
              }
            : emp,
        ),
      );
    }
    setAdjustments((prev) => [newAdjustment, ...prev]);
  };

  const handleGeneratePayslip = (employee: Employee) =>
    setSelectedEmployeeForPayslip(employee);
  const handleClosePayslip = () => setSelectedEmployeeForPayslip(null);

  // CRUD other income types
  const inferTypesFromAmount = (
    amt: number | undefined,
  ): "increase" | "decrease" => ((amt ?? 0) < 0 ? "decrease" : "increase");

  // API add
  const addOtherIncomeType = async (
    name: string,
    defaultAmount?: number,
    types?: "increase" | "decrease",
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
    types?: "increase" | "decrease",
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ onDelete: true }),
    });
    if (res.ok)
      toast.success("ลบรายได้พนักงานสำเร็จ", {
        position: "bottom-right",
      });
    if (!res.ok) {
      toast.error(`${await res.text()}`, { position: "bottom-right" });
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

          <div className="pb-3 pt-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              ภาพรวมรายได้พนักงาน
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              ข้อมูลรายได้พนักงานทั้งหมดในระบบ
            </p>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <KPIStatCard
              icon={Wallet}
              title="เงินเดือนปัจจุบัน"
              value={currentSalaryKpi}
              format="currency"
              variant="primary"
            />
            <KPIStatCard
              icon={PiggyBank}
              title="สุทธิ (ปรับทั้งหมด)"
              value={dashboardMetrics.totalNet}
              format="currency"
              variant="info"
            />
            <KPIStatCard
              icon={TrendingUp}
              title="ปรับเพิ่มเงินเดือน"
              value={dashboardMetrics.salaryIncreases}
              format="currency"
              variant="success"
            />
            <KPIStatCard
              icon={TrendingDown}
              title="ปรับลดเงินเดือน"
              value={dashboardMetrics.salaryDecreases}
              format="currency"
              variant="danger"
            />
            <KPIStatCard
              icon={PiggyBank}
              title="รายได้อื่นทั้งหมด"
              value={dashboardMetrics.otherIncome}
              format="currency"
              variant="warning"
            />
          </div>
          <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-lg p-6">
            <div className="space-y-4 md:space-y-5">
              {/* Filters */}

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>พนักงาน</Label>
                  <Select
                    value={String(overviewEmployee)}
                    onValueChange={(v) =>
                      setOverviewEmployee(v as string | "all")
                    }
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

              {/* Chart */}
              <div className="h-64 sm:h-72 md:h-80 w-full rounded-xl border bg-card">
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
            </div>
          </div>
        </TabsContent>

        {/* ========= ADJUSTMENT ========= */}
        <TabsContent value="adjustment" className="space-y-4 md:space-y-6">
          <div className="pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              ปรับรายได้พนักงาน
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left column: Form */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {adjustmentType === "salary"
                      ? "ฟอร์มปรับเงินเดือน"
                      : "ฟอร์มปรับรายได้อื่น"}
                  </h2>
                  <Select
                    value={adjustmentType}
                    onValueChange={(v: "salary" | "other") =>
                      setAdjustmentType(v)
                    }
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">
                        <div className="flex items-center gap-2">
                          ปรับเงินเดือน
                        </div>
                      </SelectItem>
                      <SelectItem value="other"> ปรับรายได้อื่น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {adjustmentType === "other" && (
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
                          // ⬇️ ไม่เปลี่ยน signature ของ modal: ส่งแค่ (name, defaultAmount?)
                          onAdd={async (name, amount) => {
                            try {
                              const created = await addOtherIncomeType(
                                name,
                                amount,
                              );
                              setOtherIncomeTypes((prev) => [created, ...prev]);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          onUpdate={async (id, name, amount) => {
                            try {
                              const updated = await updateOtherIncomeType(
                                id,
                                name,
                                amount,
                              );
                              setOtherIncomeTypes((prev) =>
                                prev.map((t) => (t.id === id ? updated : t)),
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
                      * เพิ่ม/แก้ไข/ลบ รายการได้ผ่านปุ่ม “แก้ไข”
                    </p>
                  </div>
                )}

                <Separator />

                <SalaryAdjustmentForm
                  employees={employees}
                  adjustmentType={adjustmentType}
                  onEmployeeChange={(staffId) => setLatestEmployeeOnly(staffId)}
                  onAdjustmentSubmit={(payload) => {
                    if (adjustmentType === "other") {
                      // ดึงชื่อประเภทรายได้จาก dropdown
                      const el = document.getElementById(
                        "other-income-select",
                      ) as HTMLInputElement | null;
                      const selectedIncomeName =
                        el?.value || otherIncomeTypes[0]?.name || "OT";
                      // ส่ง payload (มี detail จาก Textarea) พร้อม nameIncome จาก dropdown
                      handleSalaryAdjustment(payload, selectedIncomeName);
                    } else {
                      handleSalaryAdjustment(payload);
                    }
                  }}
                />
              </div>
            </div>

            {/* Right column: Latest */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">รายการล่าสุด</h2>
                <Badge variant="outline" className="rounded-full">
                  {adjustmentType === "salary" ? "เงินเดือน" : "รายได้อื่น"}
                </Badge>
              </div>

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
                      const employee = employeeById.get(
                        String(adjustment.staffId),
                      );
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

              {/* Summary - Current Salary or Total Other Income */}
              {latestEmployeeOnly !== "none" &&
                latestList.length > 0 &&
                (() => {
                  const emp = employees.find(
                    (e) => String(e.id) === latestEmployeeOnly,
                  );
                  if (!emp) return null;

                  if (adjustmentType === "salary") {
                    // แสดงเงินเดือนปัจจุบัน
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
                    // แสดงยอดรวมรายได้อื่นๆ
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
          </div>
        </TabsContent>

        {/* ========= DIRECTORY (Employees & Payslip) ========= */}
        <TabsContent value="directory" className="space-y-4 md:space-y-6">
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

function DeleteOtherIncomeButton({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await onConfirm();
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="hover:text-red-600 hover:scale-110 cursor-pointer transition-all"
          variant="destructive"
          size="icon"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ยืนยันการลบ</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          การลบนี้ไม่สามารถย้อนกลับได้
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                        {t.defaultAmount !== undefined &&
                          !isNaN(Number(t.defaultAmount)) && (
                            <div className="text-xs text-muted-foreground">
                              ค่าเริ่มต้น: ฿
                              {Number(t.defaultAmount).toLocaleString()}
                            </div>
                          )}
                      </div>
                      <Button
                        className="hover:text-blue-600 cursor-pointer hover:scale-110 transition-all"
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
                        <Edit3 className="h-4 w-4 " />
                      </Button>
                      <DeleteOtherIncomeButton
                        onConfirm={() => onRemove(t.id)}
                      />
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
