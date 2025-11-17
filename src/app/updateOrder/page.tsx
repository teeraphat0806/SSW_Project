"use client";

import React, { useState, useEffect, Fragment } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Button } from "../../components/ui/button";

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
  รอตัด: <CircleDashed className="h-6 w-6" />,
  กำลังตัด: <Scissors className="h-6 w-6" />,
  ชั่งน้ำหนัก: <Scale className="h-6 w-6" />,
  ตัดเสร็จสิ้น: <CheckCircle2 className="h-6 w-6" />,
  ตรวจสอบ: <ClipboardCheck className="h-6 w-6" />,
  กำลังส่ง: <Truck className="h-6 w-6" />,
  ส่งสำเร็จ: <PackageCheck className="h-6 w-6" />,
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

const steelOptions: { value: string; label: string }[] = [
  { value: "SS400", label: "SS400" },
  { value: "SKD11", label: "SKD11" },
  { value: "SKD61", label: "SKD61" },
  { value: "S45C", label: "S45C" },
  { value: "SCM440", label: "SCM440" },
];

const UpdateOrderPage = () => {
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
    <div className="min-h-screen md:pl-24">
      <div className="min-h-screen w-full bg-background text-foreground">
        {/*Header*/}
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-base font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับสู่หน้าหลัก
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Boxes className="h-10 w-10 text-primary" />

              <div>
                <h1 className="text-xl font-semibold">อัปเดตคำสั่งซื้อ</h1>
                <p className="text-sm text-small-detail">
                  Order PO: PO-2025-00123
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md bg-primary px-4 py-1.5 text-sm text-white transition hover:bg-blue-600">
                บันทึก
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 ">
           <section className="grid gap-4 rounded-2xl border border-[rgb(var(--divborder))] bg-background shadow-lg p-4 md:grid-cols-[260px,1fr]">
  {/* ซ้าย: select สถานะ (สวยขึ้น + ไอคอน) */}
  <div className="space-y-3">
    <label className="block text-base text-foreground flex items-center gap-2">
      <ClipboardCheck className="h-6 w-6" />
      สถานะการผลิต
    </label>

    <Select
      value={status}
      onValueChange={(v) => setStatus(v as OrderStatus)}
    >
      <SelectTrigger className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--foreground)/0.15)]">
        <SelectValue placeholder="เลือกสถานะงาน" />
      </SelectTrigger>
      <SelectContent className="max-h-[170px] overflow-y-auto">
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md border border-[rgb(var(--divborder))]">
                {STATUS_ICONS[s]}
              </span>
              {s}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <p className="text-sm text-[hsl(var(--small-detail))]">
      เลือกสถานะเพื่อติดตามความคืบหน้างาน
    </p>
  </div>

  {/* ขวา: stepper แสดงเป็นแถบ (กดไอคอนได้) */}
  <div className="flex items-center overflow-x-auto">
    <div className="relative w-full">
      {/* เส้นพื้นหลัง */}
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[rgb(var(--divborder))]" />
      {/* แถบ progress */}
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all"
        style={{ width: `${progressPct}%` }}
      />
      {/* จุดแต่ละสถานะ */}
      <div className="relative z-10 grid grid-cols-7 gap-2">
        {ORDER_STATUSES.map((s, i) => {
          const done = i <= currentStep;
          const active = s === status;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              title={s}
              aria-pressed={active}
              className={[
                "flex flex-col items-center gap-1 text-xs focus:outline-none",
                "transition-transform active:scale-[0.98]"
              ].join(" ")}
            >
              <div
                className={[
                  "grid h-12 w-12 place-items-center rounded-full border",
                  "transition-all",
                  done
                    ? "bg-primary text-white border-[rgb(var(--divborder))]"
                    : "bg-background text-foreground border-[rgb(var(--divborder))]",
                  active ? "ring-2 ring-[hsl(var(--foreground)/0.25)]" : ""
                ].join(" ")}
              >
                {STATUS_ICONS[s]}
              </div>
              <span
                className={[
                  "text-foreground text-[11px] md:text-xs text-center",
                  active ? "font-semibold" : ""
                ].join(" ")}
              >
                {s}
              </span>
            </button>
          );
        })}
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

            <section className="rounded-2xl border border-[rgb(var(--divborder))] bg-background shadow-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-foreground font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  รายการเหล็ก
                </h2>
                <Button
                  onClick={updateSteelItem}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> เพิ่มรายการเหล็ก
                </Button>
              </div>

              {/* cards list */}
              <div className="space-y-3">
                {steelItems.map((it, idx) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-[rgb(var(--divborder))] overflow-hidden"
                  >
                    {/* header: index badge + name + single delete */}
                    <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--divborder))] px-3 py-2">
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
                          onValueChange={(v) =>
                            patchSteelItem(it.id, { name: v })
                          }
                        >
                          <SelectTrigger className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm">
                            <SelectValue placeholder="เลือกชนิดเหล็ก" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {steelOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
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
                              quantity: Math.max(
                                1,
                                Number(e.target.value || 0)
                              ),
                            })
                          }
                          className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
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
                          className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
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
                          className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
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
                          className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
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
                                weight: Math.max(
                                  0,
                                  Number(e.target.value || 0)
                                ),
                              })
                            }
                            className="w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
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
                          className="mt-1 w-full rounded-xl border border-[rgb(var(--divborder))] bg-background px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[rgb(var(--divborder))] bg-background shadow-lg p-4">
              <h2 className="mb-2 text-base text-foreground font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> สรุป
              </h2>

              {/* การ์ดสรุปหลัก */}
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-[rgb(var(--divborder))] bg-background p-3">
                  <div className="text-sm text-foreground">
                    จำนวนรายการ (บรรทัด)
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {fmtInt(itemCount)}
                  </div>
                  <div className="mt-1 text-xs text-[hsl(var(--small-detail))]">
                    นับทุกรายการ แม้เป็นชนิดเดียวกัน
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgb(var(--divborder))] bg-background p-3">
                  <div className="text-sm text-foreground">
                    จำนวนประเภท (ยูนีค)
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {fmtInt(uniqueTypeCount)}
                  </div>
                  <div className="mt-1 text-xs text-[hsl(var(--small-detail))]">
                    รวมชนิดเหล็กไม่ซ้ำ
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgb(var(--divborder))] bg-background p-3">
                  <div className="text-sm text-foreground">จำนวนชิ้นรวม</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {fmtInt(totalQty)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[rgb(var(--divborder))] bg-background p-3">
                  <div className="text-sm text-foreground">
                    น้ำหนักรวม (กก.)
                  </div>
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
                        className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--divborder))] bg-[hsl(var(--foreground)/0.04)] px-3 py-1.5 text-xs"
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default UpdateOrderPage;
