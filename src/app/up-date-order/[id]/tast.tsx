"use client";

import React, { useState } from "react";
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
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Building2,
  Printer,
  Calculator,
} from "lucide-react";

// Components (Keep your existing imports)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- Types & Constants ---
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

export type Customer = {
  name: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  taxId?: string;
  code: string;
  fax?: string;
  address: string;
};

const mockcustomer: Customer = {
  name: "บจก. เอสเอสดับบลิว สตีล เซ็นเตอร์",
  phone: "080-123-4567",
  altPhone: "02-123-4567",
  code: "1055115410",
  email: "contact@sswsteel.co.th",
  taxId: "0105559999999",
  fax: "02-765-4321",
  address: "99/9 ถนนบางกรวย-ไทรน้อย อ.บางบัวทอง จ.นนทบุรี 11110",
};

type SteelItem = {
  id: string;
  name: string;
  quantity: number;
  width: number;
  length: number;
  height: number;
  weight?: number;
  note?: string;
};

const steelOptions: { value: string; label: string; quantity: number }[] = [
  { value: "SS400", label: "SS400", quantity: 10 },
  { value: "SKD11", label: "SKD11", quantity: 5 },
  { value: "SKD61", label: "SKD61", quantity: 8 },
  { value: "S45C", label: "S45C", quantity: 12 },
  { value: "SCM440", label: "SCM440", quantity: 7 },
];

// --- Main Component ---
const UpdateOrderPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>("รอตัด");
  const [customer, setCustomer] = useState<Customer>(mockcustomer);
  const [steelItems, setSteelItems] = useState<SteelItem[]>([
    {
      id: "1",
      name: "SS400",
      quantity: 10,
      width: 5.0,
      length: 200.0,
      height: 0.5,
    },
    {
      id: "2",
      name: "SKD11",
      quantity: 5,
      width: 10.0,
      length: 150.0,
      height: 1.0,
    },
  ]);

  // Logic Calculations
  const weightEnabled =
    ORDER_STATUSES.indexOf(status) >= ORDER_STATUSES.indexOf("ชั่งน้ำหนัก");

  const itemCount = steelItems.length;
  const uniqueTypeCount = new Set(steelItems.map((i) => i.name)).size;
  const totalQty = steelItems.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0
  );

  const totalWeight = weightEnabled
    ? steelItems.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.quantity) || 0),
        0
      )
    : 0;

  const summaryByType = steelItems.reduce((acc, i) => {
    const key = i.name || "ไม่ระบุ";
    if (!acc[key]) acc[key] = { lines: 0, qty: 0, weight: 0 };
    acc[key].lines += 1;
    acc[key].qty += Number(i.quantity) || 0;
    acc[key].weight += (Number(i.weight) || 0) * (Number(i.quantity) || 0);
    return acc;
  }, {} as Record<string, { lines: number; qty: number; weight: number }>);

  // Formatting Helpers
  const fmtInt = (n: number) => new Intl.NumberFormat("th-TH").format(n);
  const fmtWeight = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;

  // Handlers
  const updateSteelItem = () => {
    setSteelItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        name: steelOptions[0].label,
        quantity: 1,
        width: 0,
        length: 0,
        height: 0,
        note: "",
      },
    ]);
  };

  const removeSteelItem = (id: string) => {
    setSteelItems((prev) => prev.filter((item) => item.id !== id));
  };

  const patchSteelItem = (id: string, patch: Partial<SteelItem>) => {
    setSteelItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-20">
      {/* --- Header Bar --- */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 leading-tight">
                  อัปเดตคำสั่งซื้อ
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  PO-2025-00123
                </p>
              </div>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200">
            บันทึกข้อมูล
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* --- Section 1: Progress Tracker --- */}
        <section className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              สถานะการผลิต
            </h2>
            <p className="text-sm text-slate-500">
              อัปเดตสถานะงานปัจจุบันเพื่อให้ลูกค้าทราบความคืบหน้า
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Quick Select */}
            <div className="w-full md:w-72 shrink-0 space-y-2">
              <label className="text-xs font-medium uppercase text-slate-500 tracking-wider">
                เปลี่ยนสถานะ
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger className="w-full h-11 border-slate-200 bg-slate-50 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        {STATUS_ICONS[s]} <span>{s}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right: Stepper Visual */}
            <div className="flex-1 overflow-x-auto pb-4 md:pb-0">
              <div className="relative min-w-[600px] px-2 pt-2">
                <div className="absolute top-6 left-0 h-1 w-full rounded-full bg-slate-100" />
                <div
                  className="absolute top-6 left-0 h-1 rounded-full bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
                <div className="relative z-10 flex justify-between">
                  {ORDER_STATUSES.map((s, i) => {
                    const isCompleted = i <= currentStep;
                    const isActive = s === status;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`group flex flex-col items-center gap-2 outline-none transition-all ${
                          isActive ? "scale-110" : "hover:scale-105"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                            isCompleted
                              ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-200"
                              : "border-slate-200 bg-white text-slate-300"
                          } ${
                            isActive ? "ring-4 ring-blue-100" : ""
                          }`}
                        >
                          {STATUS_ICONS[s]}
                        </div>
                        <span
                          className={`text-[10px] font-medium transition-colors ${
                            isActive
                              ? "text-blue-600"
                              : isCompleted
                              ? "text-slate-600"
                              : "text-slate-400"
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
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-500" />
              ข้อมูลลูกค้า
            </h2>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <User className="h-3 w-3" /> ชื่อลูกค้า
              </label>
              <Input
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <FileText className="h-3 w-3" /> รหัสลูกค้า (Code)
              </label>
              <Input
                value={customer.code}
                onChange={(e) =>
                  setCustomer({ ...customer, code: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <FileText className="h-3 w-3" /> เลขผู้เสียภาษี (Tax ID)
              </label>
              <Input
                value={customer.taxId}
                onChange={(e) =>
                  setCustomer({ ...customer, taxId: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Phone className="h-3 w-3" /> เบอร์โทรศัพท์
              </label>
              <Input
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Mail className="h-3 w-3" /> อีเมล
              </label>
              <Input
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <Printer className="h-3 w-3" /> แฟกซ์
              </label>
              <Input
                value={customer.fax}
                onChange={(e) =>
                  setCustomer({ ...customer, fax: e.target.value })
                }
                className="bg-white border-slate-200 focus-visible:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                <MapPin className="h-3 w-3" /> ที่อยู่จัดส่ง
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
              />
            </div>
          </div>
        </section>

        {/* --- Section 3: Order Lines --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-blue-500" />
              รายการสินค้า
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                {itemCount} รายการ
              </span>
            </h2>
            <Button
              onClick={updateSteelItem}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              เพิ่มรายการ
            </Button>
          </div>

          <div className="space-y-3">
            {steelItems.map((it, idx) => (
              <div
                key={it.id}
                className="group relative rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* ID Badge Absolute */}
                <div className="absolute -left-2 top-4 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white shadow-sm">
                  {idx + 1}
                </div>

                <div className="p-4 lg:p-1 lg:flex lg:items-center lg:gap-4">
                  
                  {/* Grid Layout Container */}
                  <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-12 items-start lg:items-center">
                    
                    {/* Item Type - Col Span 3 */}
                    <div className="lg:col-span-3 lg:pl-4">
                      <label className="lg:hidden text-xs text-slate-400 mb-1 block">ชนิดเหล็ก</label>
                      <Select
                        value={it.name}
                        onValueChange={(v) =>
                          patchSteelItem(it.id, { name: v })
                        }
                      >
                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 font-medium">
                          <SelectValue placeholder="เลือกชนิด" />
                        </SelectTrigger>
                        <SelectContent>
                          {steelOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label} <span className="text-slate-400 text-xs ml-2">(คงเหลือ {opt.quantity})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dimensions Group - Col Span 4 */}
                    <div className="lg:col-span-4 grid grid-cols-3 gap-2">
                       <div>
                         <label className="text-[10px] text-slate-400 mb-1 block text-center">กว้าง</label>
                         <div className="relative">
                           <Input
                             type="number"
                             className="h-9 pr-6 text-center"
                             value={it.width}
                             onChange={(e) => patchSteelItem(it.id, { width: parseFloat(e.target.value) || 0 })}
                           />
                           <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span>
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] text-slate-400 mb-1 block text-center">ยาว</label>
                         <div className="relative">
                           <Input
                             type="number"
                             className="h-9 pr-6 text-center"
                             value={it.length}
                             onChange={(e) => patchSteelItem(it.id, { length: parseFloat(e.target.value) || 0 })}
                           />
                           <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span>
                         </div>
                       </div>
                       <div>
                         <label className="text-[10px] text-slate-400 mb-1 block text-center">สูง</label>
                         <div className="relative">
                           <Input
                             type="number"
                             className="h-9 pr-6 text-center"
                             value={it.height}
                             onChange={(e) => patchSteelItem(it.id, { height: parseFloat(e.target.value) || 0 })}
                           />
                           <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">cm</span>
                         </div>
                       </div>
                    </div>

                    {/* Quantity - Col Span 1 */}
                    <div className="lg:col-span-1">
                      <label className="text-[10px] text-slate-400 mb-1 block text-center lg:hidden">จำนวน</label>
                      <div className="flex items-center justify-center">
                        <Input
                          type="number"
                          min={1}
                          className="h-9 w-full text-center font-semibold text-blue-600 border-blue-100 bg-blue-50/20"
                          value={it.quantity}
                          onChange={(e) => patchSteelItem(it.id, { quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    {/* Weight (Conditional) - Col Span 2 */}
                    <div className="lg:col-span-2">
                       {weightEnabled ? (
                         <div>
                            <label className="text-[10px] text-slate-400 mb-1 block text-center lg:hidden">น้ำหนัก/ชิ้น</label>
                            <div className="relative">
                              <Input
                                type="number"
                                className="h-9 pr-8 text-right font-mono text-sm"
                                value={it.weight ?? 0}
                                onChange={(e) => patchSteelItem(it.id, { weight: parseFloat(e.target.value) || 0 })}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Kg.</span>
                            </div>
                         </div>
                       ) : (
                         <div className="hidden lg:flex items-center justify-center h-full">
                           <span className="text-xs text-slate-300 italic">รอชั่ง</span>
                         </div>
                       )}
                    </div>
                    
                    {/* Note & Action - Col Span 2 */}
                    <div className="lg:col-span-2 flex items-center gap-2">
                       <Input
                          className="h-9 text-xs"
                          placeholder="หมายเหตุ..."
                          value={it.note ?? ""}
                          onChange={(e) => patchSteelItem(it.id, { note: e.target.value })}
                        />
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSteelItem(it.id)}
                          className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty State / Quick Add */}
            <button
               onClick={updateSteelItem}
               className="w-full rounded-xl border-2 border-dashed border-slate-200 p-4 text-sm text-slate-400 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
            </button>
          </div>
        </section>

        {/* --- Section 4: Summary Dashboard --- */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Summary Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="text-xs text-slate-500 font-medium uppercase">รายการทั้งหมด</div>
                <div className="flex items-end justify-between mt-2">
                   <span className="text-3xl font-bold text-slate-800">{fmtInt(itemCount)}</span>
                   <Boxes className="h-5 w-5 text-slate-300" />
                </div>
             </div>
             
             <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="text-xs text-slate-500 font-medium uppercase">ประเภทเหล็ก</div>
                <div className="flex items-end justify-between mt-2">
                   <span className="text-3xl font-bold text-slate-800">{fmtInt(uniqueTypeCount)}</span>
                   <ListChecks className="h-5 w-5 text-slate-300" />
                </div>
             </div>

             <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-blue-200 flex flex-col justify-between">
                <div className="text-xs text-blue-100 font-medium uppercase">จำนวนชิ้นรวม</div>
                <div className="flex items-end justify-between mt-2">
                   <span className="text-3xl font-bold">{fmtInt(totalQty)}</span>
                   <span className="text-sm text-blue-200 mb-1">ชิ้น</span>
                </div>
             </div>

             <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="text-xs text-slate-500 font-medium uppercase">น้ำหนักรวม</div>
                <div className="flex items-end justify-between mt-2">
                   {weightEnabled ? (
                      <span className="text-2xl font-bold text-slate-800">{fmtWeight(totalWeight)}</span>
                   ) : (
                      <span className="text-lg font-medium text-slate-400 italic">--</span>
                   )}
                   <span className="text-xs text-slate-400 mb-1">Kg.</span>
                </div>
             </div>
          </div>
          
          {/* Type Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
             <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-slate-400" /> สรุปแยกประเภท
             </h3>
             <div className="space-y-3">
               {Object.entries(summaryByType).length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">ยังไม่มีรายการ</p>
               )}
               {Object.entries(summaryByType).map(([type, v]) => (
                 <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-blue-500" />
                       <span className="font-medium text-slate-700">{type}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-slate-900 font-semibold">{fmtInt(v.qty)} ชิ้น</span>
                       {weightEnabled && (
                          <span className="text-xs text-slate-400 ml-2">({fmtWeight(v.weight)} kg)</span>
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