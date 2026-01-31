"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ListChecks,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Layers,
  Package,
  CheckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { tr } from "date-fns/locale";
import { ToastContainer, toast } from "react-toastify";
import {
  SteelShape,
  CuttingMethod,
} from "@/app/up-date-order/[id]/UpdateOrderClient";
import { ShapeSteel } from "@prisma/client";

type SteelItem = {
  id: number;
  steelType: string;
  quantity: number;
  width?: number | null;
  length: number;
  thickness: number;
  detail?: string | null;
  weight?: number | null;
  shape: SteelShape;
  job?: number | null;
  cuttingMethod: CuttingMethod;
  total: number | null; //ค่าส่งจริงส่งไปแค่ตอน CNC
  cncTotalDraft?: number | null; // total จำค่าไว้ เฉพาะ UI
  discount: number | null;
};

type SteelOption = {
  value: string;
  label: string;
  quantity: number;
  shape: SteelShape;
};

//  job ต้องมีอย่างน้อย id + steel
type JobWithSteel = {
  id: string | number;
  steel: SteelItem[];
};

//  รับ job เป็น null ได้ (ตรงกับ parent)
type Props<T extends JobWithSteel> = {
  job: T | null;
  setJob: React.Dispatch<React.SetStateAction<T | null>>;
  steelOptions: SteelOption[];
  weightEnabled: boolean;
  className?: string;
  useJob: boolean;
  setUseJob: React.Dispatch<React.SetStateAction<boolean>>;
};

const shapeText = (s: SteelShape) => (s === "line" ? "เพลา" : "แผ่น");

function SteelSearchSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SteelOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedOpt = options.find((o) => o.value === value);
  const selectedLabel = selectedOpt
    ? `${selectedOpt.label} (${shapeText(selectedOpt.shape)})`
    : value
      ? value
      : "เลือกชนิด";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between border-zinc-200 bg-zinc-50 font-medium",
            "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[--radix-popover-trigger-width] p-0 border-zinc-200 bg-white",
          "dark:border-zinc-700 dark:bg-zinc-900",
        )}
      >
        <Command>
          <CommandInput placeholder="พิมพ์ค้นหาเหล็ก..." />
          <CommandList>
            <CommandEmpty>ไม่พบเหล็กที่ค้นหา</CommandEmpty>

            <CommandGroup>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${shapeText(opt.shape)}`} //ค้นหาได้ทั้งชื่อและรูปทรง
                    onSelect={() => {
                      onChange(opt.value); // ส่งค่า value กลับ
                      setOpen(false); // ปิด dropdown
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">
                        {opt.label} ({shapeText(opt.shape)})
                      </span>
                    </div>

                    <span className="ml-3 shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
                      (คงเหลือ {opt.quantity})
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function DetailItem<T extends JobWithSteel>({
  job,
  setJob,
  steelOptions,
  weightEnabled,
  className,
  useJob,
  setUseJob,
}: Props<T>) {
  const itemCount = useMemo(() => job?.steel?.length ?? 0, [job?.steel]);

  if (!job) {
    return (
      <section className={["space-y-3", className ?? ""].join(" ")}>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          กำลังโหลดข้อมูล...
        </div>
      </section>
    );
  }

  // const clearAllJobs = () => {
  //   setJob((prev) => {
  //     if (!prev) return prev;
  //     return {
  //       ...prev,
  //       steel: (prev.steel ?? []).map((s) => ({ ...s, job: null })),
  //     };
  //   });
  // };

  // const handleToggleJob = () => {
  //   setUseJob((prev) => {
  //     const next = !prev;

  //     // ถ้ากำลัง "ปิด" ช่อง job -> เคลียร์ค่า job ทั้งหมดเป็น null
  //     if (!next) clearAllJobs();

  //     return next;
  //   });
  // };
  const MAX_ITEMS = 15;
  // ✅ เพิ่มเหล็ก
  const addSteelItem = () => {
    setJob((prev) => {
      if (!prev) return prev;

      const firstOpt = steelOptions?.[0];
      const firstType = firstOpt?.value ?? "";
      const firstShape: ShapeSteel = firstOpt?.shape ?? "square";

      return {
        ...prev,
        steel: [
          ...(prev.steel ?? []),
          {
            steelType: firstType,
            quantity: 1,
            width: firstShape === "line" ? null : 1,
            length: 1,
            thickness: 1,
            detail: "",
            weight: null,
            job: null,
            cuttingMethod: "normal",
            shape: firstShape,
            total: null,
            discount: null,
          },
        ],
      };
    });
  };
  const addSteelItemLimited = () => {
    if ((job?.steel?.length ?? 0) >= MAX_ITEMS) {
      toast.error(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`, {
        position: "bottom-right",
      });

      return;
    }
    addSteelItem();
  };

  // ✅ ลบเหล็ก
  const removeSteelItem = (index: number) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steel: (prev.steel ?? []).filter((_, i) => i !== index),
      };
    });
  };

  // ✅ แก้เหล็ก
  const patchSteelItem = (index: number, patch: Partial<SteelItem>) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steel: (prev.steel ?? []).map((item, i) =>
          i === index ? { ...item, ...patch } : item,
        ),
      };
    });
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-500" />
          รายการเหล็ก
          <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
            {itemCount} รายการ
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Toggle Job */}
          <Button
            type="button"
            variant={useJob ? "default" : "outline"}
            onClick={() => {
              setUseJob((prev) => !prev);
            }}
            className={[
              "h-10 rounded-xl",
              useJob
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/40",
            ].join(" ")}
          >
            <Layers className="mr-2 h-4 w-4" />
            {useJob ? "กำลังกรอก Job" : "กรอก Job"}
          </Button>

          {/* Add */}
          <Button
            type="button"
            onClick={addSteelItemLimited}
            disabled={
              steelOptions.length === 0 || job.steel.length >= MAX_ITEMS
            }
            className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
            title={"เพิ่มรายการใหม่ (สูงสุด " + MAX_ITEMS + " รายการ)"}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Max items warning */}
      {job.steel.length >= MAX_ITEMS && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {job.steel.length} รายการ)
        </p>
      )}

      {/* Items */}
      <div className="space-y-3">
        {(job.steel ?? []).map((item, idx) => {
          const isLine = item.shape === "line";

          return (
            <div key={`${job.id}-${idx}`} className="group relative">
              {/* Index bubble */}
              <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
                {idx + 1}
              </div>

              {/* Card */}
              <div className="group relative mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex flex-col gap-y-3">
                  {/* --- ROW 1: Spec (Type, Dimensions, Qty, Weight) --- */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                    {/* 1) Steel Type */}
                    <div className="lg:col-span-3">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        ชนิดเหล็ก
                      </label>

                      <SteelSearchSelect
                        value={item.steelType}
                        onChange={(v) => {
                          const opt = steelOptions.find((o) => o.value === v);

                          // คง logic เดิม: update steelType + shape + width null เมื่อเป็น line
                          patchSteelItem(idx, {
                            steelType: v,
                            shape: opt?.shape ?? item.shape ?? "square",
                            width:
                              (opt?.shape ?? item.shape) === "line"
                                ? null
                                : (item.width ?? 0),
                          });
                        }}
                        options={steelOptions}
                        disabled={steelOptions.length === 0}
                      />
                    </div>

                    {/* 2) Dimensions */}
                    <div className="lg:col-span-5">
                      <div
                        className={[
                          "grid gap-2",
                          isLine ? "grid-cols-2" : "grid-cols-3",
                        ].join(" ")}
                      >
                        {/* Thickness */}
                        <div>
                          <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            หนา
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className="h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                              value={item.thickness ?? 0}
                              onChange={(e) =>
                                patchSteelItem(idx, {
                                  thickness: Math.max(
                                    0,
                                    Number(e.target.value || 0),
                                  ),
                                })
                              }
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                              mm
                            </span>
                          </div>
                        </div>

                        {/* Width (only square) */}
                        {!isLine && (
                          <div>
                            <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {item.cuttingMethod === "steelDisc"
                                ? "วงใน"
                                : "กว้าง"}
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                className="h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                value={item.width ?? 0}
                                onChange={(e) =>
                                  patchSteelItem(idx, {
                                    width: Math.max(
                                      0,
                                      Number(e.target.value || 0),
                                    ),
                                  })
                                }
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                mm
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Length */}
                        <div>
                          <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {item.cuttingMethod === "steelDisc"
                              ? "วงนอก"
                              : "ยาว"}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className="h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                              value={item.length ?? 0}
                              onChange={(e) =>
                                patchSteelItem(idx, {
                                  length: Math.max(
                                    0,
                                    Number(e.target.value || 0),
                                  ),
                                })
                              }
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                              mm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3) Quantity */}
                    <div className="lg:col-span-2">
                      <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        จำนวน
                      </label>
                      <Input
                        type="number"
                        min={1}
                        className="h-10 w-full border-blue-200 bg-blue-50 text-center font-bold text-blue-700 shadow-sm focus-visible:ring-blue-500 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400"
                        value={item.quantity ?? 1}
                        onChange={(e) =>
                          patchSteelItem(idx, {
                            quantity: Math.max(1, Number(e.target.value || 1)),
                          })
                        }
                      />
                    </div>

                    {/* 4) Weight */}
                    <div className="lg:col-span-2">
                      {weightEnabled ? (
                        <div>
                          <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            น้ำหนักท/กก.
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className="h-10 border-zinc-200 bg-white pr-8 text-right font-mono text-sm hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                              value={item.weight ?? 0}
                              onChange={(e) =>
                                patchSteelItem(idx, {
                                  weight: Math.max(
                                    0,
                                    Number(e.target.value || 0),
                                  ),
                                })
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                              Kg.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col justify-end pb-2 lg:items-center">
                          <div className="mb-1 h-4 w-full" />
                          <span className="text-sm italic text-zinc-300 dark:text-zinc-600">
                            รอชั่ง
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                  {/* --- ROW 2: Job + Note + Delete --- */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                    <div className="flex-none">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        วิธีตัด
                      </label>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextMethod: CuttingMethod =
                              item.cuttingMethod === "FB" ? "normal" : "FB";

                            patchSteelItem(idx, {
                              cuttingMethod: nextMethod,

                              // ถ้ากำลังออกจาก CNC ให้จำค่าที่เคยกรอกไว้ก่อน
                              cncTotalDraft:
                                item.cuttingMethod === "CNC"
                                  ? (item.total ?? item.cncTotalDraft ?? null)
                                  : (item.cncTotalDraft ?? null),

                              // ไม่ใช่ CNC ต้องล้าง total เสมอ
                              total: null,
                            });
                          }}
                          disabled={isLine}
                          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                          ${
                            item.cuttingMethod === "FB"
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }
                          ${isLine ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border
                            ${
                              item.cuttingMethod === "FB"
                                ? "border-blue-500 bg-blue-500"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {item.cuttingMethod === "FB" && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          F/P
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const currentMethod =
                              item.cuttingMethod === "steelDisc"
                                ? "normal"
                                : "steelDisc";
                            patchSteelItem(idx, {
                              cuttingMethod: currentMethod,
                              cncTotalDraft:
                                item.cuttingMethod === "CNC"
                                  ? (item.total ?? item.cncTotalDraft ?? null)
                                  : (item.cncTotalDraft ?? null),
                              total: null,
                            });
                          }}
                          disabled={isLine}
                          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                          ${
                            item.cuttingMethod === "steelDisc"
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }
                          ${isLine ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border
                            ${
                              item.cuttingMethod === "steelDisc"
                                ? "border-blue-500 bg-blue-500"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {item.cuttingMethod === "steelDisc" && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          หนากลม
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const currentMethod =
                              item.cuttingMethod === "CNC" ? "normal" : "CNC";
                            if (currentMethod === "CNC") {
                              patchSteelItem(idx, {
                                cuttingMethod: currentMethod,
                                total: item.cncTotalDraft ?? null,
                              });
                            } else {
                              patchSteelItem(idx, {
                                cuttingMethod: "normal",
                                cncTotalDraft:
                                  item.total ?? item.cncTotalDraft ?? null,
                                total: null,
                              });
                            }
                          }}
                          disabled={isLine}
                          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                          ${
                            item.cuttingMethod === "CNC"
                              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          }
                          ${isLine ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border
                            ${
                              item.cuttingMethod === "CNC"
                                ? "border-blue-500 bg-blue-500"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {item.cuttingMethod === "CNC" && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          CNC
                        </button>
                      </div>
                    </div>

                    {/* CNC Total (only when CNC) */}
                    {item.cuttingMethod === "CNC" && (
                      <div className="w-full lg:w-44 flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          ราคาตัด CNC
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            value={item.total ?? ""}
                            onChange={(e) => {
                              const v =
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, Number(e.target.value)); //ไม่ให้ติดลบ
                              patchSteelItem(idx, {
                                //idx คือ index ของ item ที่จะแก้
                                total: v,
                                cncTotalDraft: v,
                              });
                            }}
                            placeholder="0"
                            className="h-10 border-zinc-200 bg-white text-right pr-10 font-mono dark:border-zinc-700 dark:bg-zinc-900"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                            ฿
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Discount */}
                    <div className="w-full lg:w-40 flex-none">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        ส่วนลด (บาท)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount ?? ""}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              discount:
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, Number(e.target.value)),
                            })
                          }
                          placeholder="0"
                          className="h-10 border-zinc-200 bg-white text-right pr-10 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                          ฿
                        </span>
                      </div>
                    </div>

                    {/* Job */}
                    {useJob && (
                      <div className="w-full lg:w-32 flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Job No.
                        </label>
                        <Input
                          type="number"
                          value={item.job ?? ""}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              job:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            } as any)
                          }
                          placeholder="No."
                          className="h-10 border-zinc-200 bg-white text-center dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    )}

                    {/* Note */}
                    <div className="flex-1 min-w-[150px]">
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        หมายเหตุ
                      </label>
                      <Input
                        value={item.detail ?? ""}
                        onChange={(e) =>
                          patchSteelItem(idx, { detail: e.target.value })
                        }
                        placeholder="รายละเอียดเพิ่มเติม..."
                        className="h-10 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>

                    {/* Delete */}
                    <div className="flex-none pb-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSteelItem(idx)}
                        disabled={job.steel.length <= 1}
                        className="h-9 w-9 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {job.steel.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-950/20 dark:text-zinc-500 dark:border-zinc-800">
            <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p>ยังไม่มีรายการเหล็ก กดปุ่ม "เพิ่ม" เพื่อเริ่มรายการ</p>
          </div>
        )}
      </div>

      {/* Bottom helper + Add bottom */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {job.steel.length} รายการ)
      </p>

      <button
        type="button"
        onClick={addSteelItemLimited}
        disabled={steelOptions.length === 0 || job.steel.length >= MAX_ITEMS}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
      </button>
    </section>
  );
}
