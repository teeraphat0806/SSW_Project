"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "../../../components/ui/button";

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
  รอตัด: <CircleDashed className="h-4 w-4" />,
  กำลังตัด: <Scissors className="h-4 w-4" />,
  ชั่งน้ำหนัก: <Scale className="h-4 w-4" />,
  ตัดเสร็จสิ้น: <CheckCircle2 className="h-4 w-4" />,
  ตรวจสอบ: <ClipboardCheck className="h-4 w-4" />,
  กำลังส่ง: <Truck className="h-4 w-4" />,
  ส่งสำเร็จ: <PackageCheck className="h-4 w-4" />,
};

export type Customer = {
  name: string;
  phone?: string; // เบอร์โทรหลัก
  altPhone?: string; // เบอร์โทรสำรอง
  email?: string;
  taxId?: string; // เลขผู้เสียภาษี
  code: string; // รหัสลูกค้า
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
  name: string; // key จากรายการเหล็ก
  quantity: number;
  width: number; // ซม.
  length: number; // ซม.
  height: number; // ซม.
  weight?: number; // กก.
  note?: string;
};

const steelOptions: { value: string; label: string; quantity: number }[] = [
  { value: "SS400", label: "SS400", quantity: 10 },
  { value: "SKD11", label: "SKD11", quantity: 5 },
  { value: "SKD61", label: "SKD61", quantity: 8 },
  { value: "S45C", label: "S45C", quantity: 12 },
  { value: "SCM440", label: "SCM440", quantity: 7 },
];

const UpdateOrderPage = ({ id }: { id: string }) => {
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

  const weightEnabled =
    ORDER_STATUSES.indexOf(status) >= ORDER_STATUSES.indexOf("ชั่งน้ำหนัก");
  // คำนวณสรุปหลัก
  const itemCount = steelItems.length;
  const uniqueTypeCount = new Set(steelItems.map((i) => i.name)).size;
  const totalQty = steelItems.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0
  );

  // น้ำหนักรวม (คิดเมื่อ weightEnabled เท่านั้น)
  const totalWeight = weightEnabled
    ? steelItems.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.quantity) || 0),
        0
      )
    : 0;

  // breakdown ตาม "ชนิดเหล็ก" (เอาไว้แสดงย่อใต้การ์ด)
  const summaryByType = steelItems.reduce((acc, i) => {
    const key = i.name || "ไม่ระบุ";
    if (!acc[key]) acc[key] = { lines: 0, qty: 0, weight: 0 };
    acc[key].lines += 1;
    acc[key].qty += Number(i.quantity) || 0;
    acc[key].weight += (Number(i.weight) || 0) * (Number(i.quantity) || 0);
    return acc;
  }, {} as Record<string, { lines: number; qty: number; weight: number }>);

  // helper แสดงตัวเลขสวย ๆ
  const fmtInt = (n: number) => Intl.NumberFormat().format(n);
  const fmtWeight = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;
  const router = useRouter();

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
    <div>
      {/*Header*/}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* ปุ่มย้อนกลับ */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>

            {/* เส้นคั่นแนวตั้ง */}
            <div className="h-6 w-px bg-border/60" />

            {/* ส่วน Icon และ Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:shadow-none">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  อัปเดตคำสั่งซื้อ
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  PO-2025-00123
                </p>
              </div>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <Button className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none">
            บันทึกข้อมูล
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <section className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Header Section */}
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              สถานะการผลิต
            </h2>
            <p className="text-sm text-muted-foreground">
              อัปเดตสถานะงานปัจจุบันเพื่อให้ลูกค้าทราบความคืบหน้า
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Quick Select */}
            <div className="w-full md:w-72 shrink-0 space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                เปลี่ยนสถานะ
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger className="w-full h-11 border-border bg-muted/30 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        {/* Clone icon to enforce size consistent with design */}
                        {React.isValidElement(STATUS_ICONS[s]) &&
                          React.cloneElement(
                            STATUS_ICONS[s] as React.ReactElement,
                            {
                              class: "h-4 w-4",
                            } as any
                          )}
                        <span>{s}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right: Stepper Visual */}
            <div className="flex-1 pb-4 md:pb-0">
              <div className="relative min-w-[600px] px-2 pt-2">
                {/* Track Background */}
                <div className="absolute top-6 left-0 h-1 w-full rounded-full bg-muted" />

                {/* Active Progress Bar */}
                <div
                  className="absolute top-6 left-0 h-1 rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />

                {/* Steps Nodes */}
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
                              ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                              : "border-border bg-card text-muted-foreground/40"
                          } ${isActive ? "ring-4 ring-primary/20" : ""}`}
                        >
                          {/* Clone icon to control sizing inside the circle */}
                          {React.isValidElement(STATUS_ICONS[s]) &&
                            React.cloneElement(
                              STATUS_ICONS[s] as React.ReactElement,
                              {
                                className: "h-4 w-4",
                              }
                            )}
                        </div>
                        <span
                          className={`text-[10px] font-medium transition-colors ${
                            isActive
                              ? "text-primary font-bold"
                              : isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
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

        <section className="rounded-2xl border border-divborder bg-background shadow-lg p-4 ">
          <h1 className="mb-3 text-foreground text-base font-semibold">
            ข้อมูลลูกค้า
          </h1>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-foreground">ชื่อลูกค้า</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                placeholder="example@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">เบอร์โทร</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                placeholder="080-xxx-xxxx"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">อีเมล</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
                placeholder="example@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Code</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.code}
                onChange={(e) =>
                  setCustomer({ ...customer, code: e.target.value })
                }
                placeholder="รหัสลูกค้า"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Tax ID</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.taxId}
                onChange={(e) =>
                  setCustomer({ ...customer, taxId: e.target.value })
                }
                placeholder="เลขผู้เสียภาษี 13 หลัก"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground">Fax</label>
              <input
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                value={customer.fax}
                onChange={(e) =>
                  setCustomer({ ...customer, fax: e.target.value })
                }
                placeholder="02-xxx-xxxx"
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <label className="text-sm text-foreground">ที่อยู่</label>
              <textarea
                className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                rows={2}
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-divborder bg-background shadow-lg p-4">
          <div className="mb-3 flex items-center border border-divborder justify-between">
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              รายการเหล็ก
            </h2>
            <Button
              onClick={updateSteelItem}
              className="inline-flex items-center text-white gap-2"
            >
              <Plus className="h-4 w-4" /> เพิ่มรายการเหล็ก
            </Button>
          </div>

          {/* cards list */}
          <div className="space-y-3">
            {steelItems.map((it, idx) => (
              <div
                key={it.id}
                className="rounded-xl border border-divborder overflow-hidden"
              >
                {/* header: index badge + name + single delete */}
                <div className="flex items-center justify-between gap-3 border-b border-divborder px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--foreground)/0.06)] text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {it.name || "— ยังไม่เลือกชนิดเหล็ก —"}
                      </div>
                      <div className="text-[11px] text-[hsl(var(--small-detail))]">
                        : {it.id}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => removeSteelItem(it.id)}
                    className="inline-flex items-center gap-2 border-red-300 text-red-600 hover:brightness-110"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="h-4 w-4" /> ลบ
                  </Button>
                </div>

                {/* body: editable grid */}
                <div
                  className={`grid gap-3 p-3 ${
                    weightEnabled ? "md:grid-cols-6" : "md:grid-cols-5"
                  }`}
                >
                  {/* ชนิดเหล็ก */}
                  <div className="space-y-1">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      ชนิดเหล็ก
                    </label>
                    <Select
                      value={it.name}
                      onValueChange={(v) => patchSteelItem(it.id, { name: v })}
                    >
                      <SelectTrigger className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="เลือกชนิดเหล็ก" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {steelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-row">
                              <span>{opt.label}</span>
                              <span className="ml-2 text-[hsl(var(--small-detail))]">
                                คงเหลือ: {opt.quantity} ชิ้น
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* จำนวน */}
                  <div className="space-y-1">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      จำนวน
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        patchSteelItem(it.id, {
                          quantity: Math.max(1, Number(e.target.value || 0)),
                        })
                      }
                      className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* กว้าง */}
                  <div className="space-y-1">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      กว้าง (ซม.)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={it.width}
                      onChange={(e) =>
                        patchSteelItem(it.id, {
                          width: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                      className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* ยาว */}
                  <div className="space-y-1">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      ยาว (ซม.)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={it.length}
                      onChange={(e) =>
                        patchSteelItem(it.id, {
                          length: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                      className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {/* สูง/หนา */}
                  <div className="space-y-1">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      สูง/หนา (ซม.)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={it.height}
                      onChange={(e) =>
                        patchSteelItem(it.id, {
                          height: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                      className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  {weightEnabled && (
                    <div className="space-y-1">
                      <label className="text-xs text-[hsl(var(--small-detail))]">
                        น้ำหนัก/ชิ้น (กก.)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={it.weight ?? 0}
                        onChange={(e) =>
                          patchSteelItem(it.id, {
                            weight: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                        className="w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  {/* หมายเหตุ – เต็มแถว */}
                  <div className="md:col-span-5">
                    <label className="text-xs text-[hsl(var(--small-detail))]">
                      หมายเหตุ
                    </label>
                    <textarea
                      value={it.note ?? ""}
                      onChange={(e) =>
                        patchSteelItem(it.id, { note: e.target.value })
                      }
                      placeholder="หมายเหตุ..."
                      className="mt-1 w-full rounded-xl border border-divborder bg-background px-3 py-2 text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-divborder bg-background shadow-lg p-4">
          <h2 className="mb-2 text-base text-foreground font-semibold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> สรุป
          </h2>

          {/* การ์ดสรุปหลัก */}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-divborder bg-background p-3">
              <div className="text-sm text-foreground">จำนวนรายการ</div>
              <div className="mt-1 text-2xl font-semibold">
                {fmtInt(itemCount)}
              </div>
              <div className="mt-1 text-xs text-[hsl(var(--small-detail))]">
                นับทุกรายการ แม้เป็นชนิดเดียวกัน
              </div>
            </div>

            <div className="rounded-2xl border border-divborder bg-background p-3">
              <div className="text-sm text-foreground">จำนวนประเภท</div>
              <div className="mt-1 text-2xl font-semibold">
                {fmtInt(uniqueTypeCount)}
              </div>
              <div className="mt-1 text-xs text-[hsl(var(--small-detail))]">
                รวมชนิดเหล็กไม่ซ้ำ
              </div>
            </div>

            <div className="rounded-2xl border border-divborder bg-background p-3">
              <div className="text-sm text-foreground">จำนวนชิ้นรวม</div>
              <div className="mt-1 text-2xl font-semibold">
                {fmtInt(totalQty)}
              </div>
            </div>

            <div className="rounded-2xl border border-divborder bg-background p-3">
              <div className="text-sm text-foreground">น้ำหนักรวม (กก.)</div>
              <div className="mt-1 text-2xl font-semibold">
                {weightEnabled ? fmtWeight(totalWeight) : "—"}
              </div>
              {!weightEnabled && (
                <div className="mt-1 text-xs text-[hsl(var(--small-detail))]">
                  จะแสดงเมื่อสถานะเมื่อชั่งน้ำหนักแล้ว
                </div>
              )}
            </div>
          </div>

          {/* แถบสรุปย่อยตามชนิดเหล็ก (อ่านง่าย แยกชัดเจน) */}
          {Object.keys(summaryByType).length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-foreground">
                สรุปตามชนิดเหล็ก
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summaryByType).map(([type, v]) => (
                  <div
                    key={type}
                    className="inline-flex items-center gap-2 rounded-xl border border-divborder bg-[hsl(var(--foreground)/0.04)] px-3 py-1.5 text-xs"
                    title={`${type}: ${v.lines} รายการ, ${v.qty} ชิ้น${
                      weightEnabled ? `, ${fmtWeight(v.weight)} กก.` : ""
                    }`}
                  >
                    <span className="font-semibold">{type}</span>
                    <span className="text-[hsl(var(--small-detail))]">
                      {v.lines} รายการ • {fmtInt(v.qty)} ชิ้น
                      {weightEnabled ? ` • ${fmtWeight(v.weight)} กก.` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UpdateOrderPage;
