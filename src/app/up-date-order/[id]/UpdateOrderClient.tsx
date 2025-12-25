"use client";

import React, { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  CircleDashed,
  Scissors,
  Scale,
  CheckCircle2,
  ClipboardCheck,
  Truck,
  PackageCheck,
  Plus,
  ListChecks,
  Trash2,
  Phone,
  FileText,
  Mail,
  Printer,
  MapPin,
  User,
  Building2,
  Calculator,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

type shape = "square" | "line";
type Joborder = {
  id: string;
  ponumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTaxId: string;
  customerCode: string;
  customerFax: string;
  steel: {
    steeltype: string;
    quantity: number;
    width?: number | null;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: shape;
  }[];
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
};

const mockJoborder: Joborder = {
  id: "1",
  ponumber: "PO-2025-00123",
  customerId: "CUST-001",
  customerName: "บจก. เอสเอสดับบลิว สตีล เซ็นเตอร์",
  customerEmail: "contact@sswsteel.co.th",
  customerPhone: "080-123-4567",
  customerAddress: "99/9 ถนนบางกรวย-ไทรน้อย อ.บางบัวทอง จ.นนทบุรี 11110",
  customerTaxId: "0105559999999",
  customerCode: "1055115410",
  customerFax: "02-765-4321",
  steel: [
    {
      steeltype: "SS400",
      quantity: 10,
      width: 5.0,
      length: 200.0,
      thickness: 0.5,
      shape: "square",
    },
    {
      steeltype: "SKD11",
      quantity: 5,
      length: 150.0,
      thickness: 1.0,
      shape: "line",
    },
  ],
  status: "pending",
};

const ORDER_STATUSES = [
  "รอตัด",
  "กำลังตัด",
  "ชั่งน้ำหนัก",
  "ตัดเสร็จสิ้น",
  "ตรวจสอบ",
  "กำลังส่ง",
  "ส่งสำเร็จ",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  รอตัด: <CircleDashed className="h-5 w-5" />,
  กำลังตัด: <Scissors className="h-5 w-5" />,
  ชั่งน้ำหนัก: <Scale className="h-5 w-5" />,
  ตัดเสร็จสิ้น: <CheckCircle2 className="h-5 w-5" />,
  ตรวจสอบ: <ClipboardCheck className="h-5 w-5" />,
  กำลังส่ง: <Truck className="h-5 w-5" />,
  ส่งสำเร็จ: <PackageCheck className="h-5 w-5" />,
};

const steelOptions: { value: string; label: string; quantity: number }[] = [
  { value: "SS400", label: "SS400", quantity: 10 },
  { value: "SKD11", label: "SKD11", quantity: 5 },
  { value: "SKD61", label: "SKD61", quantity: 8 },
  { value: "S45C", label: "S45C", quantity: 12 },
  { value: "SCM440", label: "SCM440", quantity: 7 },
];

// ✅ map ไทย <-> อังกฤษ
const toThaiStatus = (s: Joborder["status"]): OrderStatus => {
  switch (s) {
    case "pending":
      return "รอตัด";
    case "cutting":
      return "กำลังตัด";
    case "weighing":
      return "ชั่งน้ำหนัก";
    case "ready":
      return "ตัดเสร็จสิ้น";
    case "shipped":
      return "กำลังส่ง";
    case "completed":
      return "ส่งสำเร็จ";
    default:
      return "รอตัด";
  }
};

const toApiStatus = (s: OrderStatus): Joborder["status"] => {
  switch (s) {
    case "รอตัด":
      return "pending";
    case "กำลังตัด":
      return "cutting";
    case "ชั่งน้ำหนัก":
      return "weighing";
    case "ตัดเสร็จสิ้น":
      return "ready";
    // "ตรวจสอบ" ไม่มีใน enum เดิมของ Joborder → เลย map ไป "ready"
    case "ตรวจสอบ":
      return "ready";
    case "กำลังส่ง":
      return "shipped";
    case "ส่งสำเร็จ":
      return "completed";
    default:
      return "pending";
  }
};

const UpdateOrderPage = ({ id }: { id: string }) => {
  const router = useRouter();

  // ✅ state เดียว: job (มาจาก mockJoborder)
  const [job, setJob] = useState<Joborder>(mockJoborder);

  // ✅ สถานะที่ UI ใช้ (ไทย) derive จาก job.status
  const status = useMemo(() => toThaiStatus(job.status), [job.status]);

  const weightEnabled =
    ORDER_STATUSES.indexOf(status) >= ORDER_STATUSES.indexOf("ชั่งน้ำหนัก");

  // ✅ คำนวณจาก job.steel โดยตรง
  const itemCount = job.steel.length;
  const uniqueTypeCount = new Set(job.steel.map((i) => i.steeltype)).size;
  const totalQty = job.steel.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0
  );

  const totalWeight = weightEnabled
    ? job.steel.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.quantity) || 0),
        0
      )
    : 0;

  const summaryByType = job.steel.reduce((acc, i) => {
    const key = i.steeltype || "ไม่ระบุ";
    if (!acc[key]) acc[key] = { lines: 0, qty: 0, weight: 0 };
    acc[key].lines += 1;
    acc[key].qty += Number(i.quantity) || 0;
    acc[key].weight += (Number(i.weight) || 0) * (Number(i.quantity) || 0);
    return acc;
  }, {} as Record<string, { lines: number; qty: number; weight: number }>);

  const fmtInt = (n: number) => Intl.NumberFormat().format(n);
  const fmtWeight = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;

  // ✅ เพิ่มเหล็ก: แก้ job.steel
  const addSteelItem = () => {
    setJob((prev) => ({
      ...prev,
      steel: [
        ...prev.steel,
        {
          steeltype: steelOptions[0].value,
          quantity: 1,
          width: 0,
          length: 0,
          thickness: 0,
          detail: "",
          weight: null,
          shape: "square",
        },
      ],
    }));
  };

  // ✅ ลบเหล็กด้วย index
  const removeSteelItem = (index: number) => {
    setJob((prev) => ({
      ...prev,
      steel: prev.steel.filter((_, i) => i !== index),
    }));
  };

  // ✅ patch เหล็กด้วย index
  const patchSteelItem = (
    index: number,
    patch: Partial<Joborder["steel"][number]>
  ) => {
    setJob((prev) => ({
      ...prev,
      steel: prev.steel.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  // onChange={(e) =>
  //                 setJob((prev) => ({ ...prev, customerPhone: e.target.value }))
  return (
    <div>
      {/*Header*/}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>

            <div className="h-6 w-px bg-border/60" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:shadow-none">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  อัปเดตคำสั่งซื้อ
                </h1>
                {/* ✅ ดึงจาก mockJoborder */}
                <p className="text-sm text-muted-foreground font-mono">
                  {job.ponumber}
                </p>
              </div>
            </div>
          </div>

          <Button className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none">
            บันทึกข้อมูล
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ---------- สถานะ ---------- */}
        <section className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              สถานะการผลิต
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              อัปเดตสถานะงานปัจจุบันเพื่อให้ลูกค้าทราบความคืบหน้า
            </p>
          </div>

          <div className="flex flex-col gap-8 md:flex-row">
            <div className="w-full shrink-0 space-y-2 md:w-72">
              <label className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                เปลี่ยนสถานะ
              </label>

              <Select
                value={status}
                onValueChange={(v) =>
                  setJob((prev) => ({
                    ...prev,
                    status: toApiStatus(v as OrderStatus),
                  }))
                }
              >
                <SelectTrigger className="h-11 w-full border-zinc-200 bg-zinc-50 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        {React.isValidElement(STATUS_ICONS[s]) &&
                          React.cloneElement(
                            STATUS_ICONS[s] as React.ReactElement,
                            { className: "h-5 w-5" } as any
                          )}
                        <span>{s}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stepper เดิมของคุณใช้ status ได้เหมือนเดิม */}
            <div className="flex-1  pb-4 md:pb-0">
              <div className="relative min-w-[600px] px-2 pt-2">
                <div className="absolute left-0 top-6 h-1 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div
                  className="absolute left-0 top-6 h-1 rounded-full bg-blue-600 transition-all duration-500 ease-out dark:bg-blue-500"
                  style={{ width: `${progressPct}%` }}
                />

                <div className="relative z-10 flex justify-between">
                  {ORDER_STATUSES.map((s, i) => {
                    const isCompleted = i <= currentStep;
                    const isActive = s === status;
                    return (
                      <button
                        key={s}
                        onClick={() =>
                          setJob((prev) => ({
                            ...prev,
                            status: toApiStatus(s),
                          }))
                        }
                        className={`group flex flex-col items-center gap-2 outline-none transition-all ${
                          isActive ? "scale-110" : "hover:scale-105"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                            isCompleted
                              ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 dark:border-blue-500 dark:bg-blue-500 dark:shadow-none"
                              : "border-zinc-300 bg-white text-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-700"
                          } ${
                            isActive
                              ? "ring-4 ring-blue-100 dark:ring-blue-900/40"
                              : ""
                          }`}
                        >
                          {React.isValidElement(STATUS_ICONS[s]) &&
                            React.cloneElement(
                              STATUS_ICONS[s] as React.ReactElement,
                              { className: "h-5 w-5" } as any
                            )}
                        </div>
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isActive
                              ? "font-bold text-blue-600 dark:text-blue-400"
                              : isCompleted
                              ? "text-zinc-700 dark:text-zinc-300"
                              : "text-zinc-400 dark:text-zinc-600"
                          }`}
                        >
                          {s}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Section 2: Customer Info --- */}
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header Section */}
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              <Building2 className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              ข้อมูลลูกค้า
            </h2>
          </div>

          {/* Form Grid */}
          <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <User className="h-5 w-5" /> ชื่อลูกค้า
              </label>
              <Input
                value={job.customerName}
                onChange={(e) =>
                  setJob({ ...job, customerName: e.target.value })
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Customer Code */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <FileText className="h-5 w-5" /> รหัสลูกค้า (Code)
              </label>
              <Input
                value={job.customerCode}
                onChange={(e) =>
                  setJob({ ...job, customerCode: e.target.value })
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Tax ID */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <FileText className="h-5 w-5" /> เลขผู้เสียภาษี (Tax ID)
              </label>
              <Input
                value={job.customerTaxId}
                onChange={(e) =>
                  setJob({ ...job, customerTaxId: e.target.value })
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <Phone className="h-5 w-5" /> เบอร์โทรศัพท์
              </label>
              <Input
                value={job.customerPhone}
                onChange={(e) =>
                  setJob((prev) => ({ ...prev, customerPhone: e.target.value }))
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <Mail className="h-5 w-5" /> อีเมล
              </label>
              <Input
                value={job.customerEmail}
                onChange={(e) =>
                  setJob({ ...job, customerEmail: e.target.value })
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Fax */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <Printer className="h-5 w-5" /> แฟกซ์
              </label>
              <Input
                value={job.customerFax}
                onChange={(e) =>
                  setJob({ ...job, customerFax: e.target.value })
                }
                className="border-zinc-200 bg-white focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-blue-500"
              />
            </div>

            {/* Address (Textarea) */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="flex items-center gap-2 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-5 w-5" /> ที่อยู่จัดส่ง
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-600 dark:focus-visible:ring-blue-500"
                value={job.customerAddress}
                onChange={(e) =>
                  setJob({ ...job, customerAddress: e.target.value })
                }
              />
            </div>
          </div>
        </section>

        {/* --- Section 3: Order Lines --- */}
        <section className="space-y-3">
          {job.steel.map((it, idx) => (
            <div
              key={`${job.id}-${idx}`}
              className="group relative rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* ID Badge Absolute */}
              <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
                {idx + 1}
              </div>

              <div className="p-4 lg:flex lg:items-center lg:gap-4 lg:p-1">
                {/* Grid Layout Container */}
                <div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-center">
                  {/* Item Type - Col Span 3 */}
                  <div className="lg:col-span-3 lg:pl-4">
                    {/* Label ชนิดเหล็ก ให้แสดงตลอดเพื่อให้แนวบรรทัดตรงกัน */}
                    <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400">
                      ชนิดเหล็ก
                    </label>
                    <Select
                      value={it.steeltype}
                      onValueChange={(v) =>
                        patchSteelItem(idx, { steeltype: v })
                      }
                    >
                      <SelectTrigger className="h-10 border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                        <SelectValue placeholder="เลือกชนิด" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                        {steelOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="focus:bg-zinc-100 dark:text-zinc-200 dark:focus:bg-zinc-800"
                          >
                            {opt.label}{" "}
                            <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">
                              (คงเหลือ {opt.quantity})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dimensions Group - Col Span 4 */}
                  <div className="grid grid-cols-3 gap-2 lg:col-span-4">
                    <div>
                      <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                        กว้าง
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          value={it.width ?? 0}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              width: Math.max(0, Number(e.target.value || 0)),
                            })
                          }
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                        ยาว
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          value={it.length}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              length: Math.max(0, Number(e.target.value || 0)),
                            })
                          }
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                        สูง
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          value={it.thickness}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              thickness: Math.max(
                                0,
                                Number(e.target.value || 0)
                              ),
                            })
                          }
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                          cm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity - Col Span 1 */}
                  <div className="lg:col-span-1">
                    {/* เอา lg:hidden ออก เพื่อให้แสดง label ตลอด */}
                    <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                      จำนวน
                    </label>
                    <div className="flex items-center justify-center">
                      <Input
                        type="number"
                        min={1}
                        className="h-9 w-full border-blue-100 bg-blue-50/50 text-center font-semibold text-blue-600 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                        value={it.quantity}
                        onChange={(e) =>
                          patchSteelItem(idx, {
                            quantity: Math.max(1, Number(e.target.value || 1)),
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Weight (Conditional) - Col Span 2 */}
                  <div className="lg:col-span-2">
                    {weightEnabled ? (
                      <div>
                        {/* เอา lg:hidden ออก เพื่อให้แสดง label ตลอด */}
                        <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                          น้ำหนัก/ชิ้น
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-9 border-zinc-200 bg-white pr-8 text-right font-mono text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            value={it.weight ?? 0}
                            onChange={(e) =>
                              patchSteelItem(idx, {
                                weight: Math.max(
                                  0,
                                  Number(e.target.value || 0)
                                ),
                              })
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                            Kg.
                          </span>
                        </div>
                      </div>
                    ) : (
                      // จัดตำแหน่ง Placeholder ให้ตรงกันเมื่อไม่มี Input
                      <div className="flex h-full flex-col justify-end pb-2 lg:items-center">
                        {/* ใส่ Label หลอกไว้เพื่อให้ความสูงเท่าเพื่อน (Optional) หรือจะปล่อยว่างก็ได้ */}
                        <div className="mb-1 h-4 w-full" />
                        <span className="text-sm italic text-zinc-300 dark:text-zinc-600">
                          รอชั่ง
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Note & Action - Col Span 2 */}
                  <div className="lg:col-span-2">
                    {/* เพิ่ม Label ให้หมายเหตุด้วย เพื่อให้ระดับ Input เท่ากันทั้งแถว */}
                    <label className="mb-1 block text-left text-sm text-zinc-500 dark:text-zinc-400">
                      หมายเหตุ
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-9 border-zinc-200 bg-white text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        placeholder="ระบุ..."
                        value={it.detail ?? ""}
                        onChange={(e) =>
                          patchSteelItem(idx, { detail: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSteelItem(idx)}
                        className="h-9 w-9 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ---------- สรุป (อ่านจาก job.steel) ---------- */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-2 md:grid-cols-4">
            {/* Card 1: รายการทั้งหมด */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
                รายการทั้งหมด
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {fmtInt(itemCount)}
                </span>
                <Boxes className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
              </div>
            </div>

            {/* Card 2: ประเภทเหล็ก */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
                ประเภทเหล็ก
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {fmtInt(uniqueTypeCount)}
                </span>
                <ListChecks className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
              </div>
            </div>

            {/* Card 3: จำนวนชิ้นรวม (Gradient Highlight) */}
            <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-blue-200 dark:from-blue-700 dark:to-indigo-800 dark:shadow-none">
              <div className="text-sm font-medium uppercase text-blue-100">
                จำนวนชิ้นรวม
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-bold">{fmtInt(totalQty)}</span>
                <span className="mb-1 text-sm text-blue-200">ชิ้น</span>
              </div>
            </div>

            {/* Card 4: น้ำหนักรวม */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
                น้ำหนักรวม
              </div>
              <div className="mt-2 flex items-end justify-between">
                {weightEnabled ? (
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {fmtWeight(totalWeight)}
                  </span>
                ) : (
                  <span className="text-lg font-medium italic text-zinc-400 dark:text-zinc-600">
                    --
                  </span>
                )}
                <span className="mb-1 text-sm text-zinc-400 dark:text-zinc-500">
                  Kg.
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Type Breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              <Calculator className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              สรุปแยกประเภท
            </h3>
            <div className="space-y-3">
              {Object.entries(summaryByType).length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
                  ยังไม่มีรายการ
                </p>
              )}
              {Object.entries(summaryByType).map(([type, v]) => (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {type}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {fmtInt(v.qty)} ชิ้น
                    </span>
                    {weightEnabled && (
                      <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">
                        ({fmtWeight(v.weight)} kg)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UpdateOrderPage;
