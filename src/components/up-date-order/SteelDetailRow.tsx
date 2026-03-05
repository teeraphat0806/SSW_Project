"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { ShapeSteel, CuttingMethod } from "@/types";

type SteelItem = {
  id: number;
  steelType: string;
  amount: number;
  width?: number | null;
  length: number;
  thickness: number;
  detail?: string | null;
  weight?: number | null;
  shape: ShapeSteel;
  job?: string | null;
  cuttingMethod: CuttingMethod;
  price: number;
  discount: number | null;
  manualPrice?: boolean;
  density: number;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};

type SteelOption = {
  value: string;
  codeSteel: string;
  label: string;
  price: number;
  amount: number;
  shape: ShapeSteel;
};

const DEFAULT_DENSITY = 0.0000079;
const normalizeSteelCode = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .replace(/::(square|line)$/i, "");

const shapeText = (s: ShapeSteel) => (s === "line" ? "เพลา" : "แผ่น");

const fmtKg = (n: number) =>
  Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const noNumberSpinnerClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function SteelSearchSelect({
  value,
  fallbackLabel,
  onChange,
  options,
  disabled,
}: {
  value: string;
  fallbackLabel?: string;
  onChange: (v: string) => void;
  options: SteelOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const selectedOpt = options.find((o) => o.value === value);
  const selectedLabel = selectedOpt
    ? `${selectedOpt.label} (${shapeText(selectedOpt.shape)})`
    : fallbackLabel
      ? fallbackLabel
      : "เลือกชนิด";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={cn(
          "h-10 w-full flex items-center justify-between px-3 py-2 border border-zinc-200 bg-zinc-50 font-medium rounded-md text-sm",
          "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
          "hover:bg-zinc-100 dark:hover:bg-zinc-700",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <svg
          className="w-4 h-4 shrink-0 opacity-60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-2 text-center text-sm text-zinc-500">
              ไม่พบเหล็กที่ค้นหา
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between",
                  selectedOpt?.value === opt.value &&
                    "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                )}
              >
                <span className="truncate">
                  {opt.label} ({shapeText(opt.shape)})
                </span>
                <span className="ml-2 shrink-0 text-xs text-zinc-500">
                  (คงเหลือ {opt.amount})
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
}

type SteelDetailRowProps = {
  item: SteelItem;
  idx: number;
  jobId: string | number;
  steelOptions: SteelOption[];
  useJob: boolean;
  patchSteelItem: (index: number, patch: Partial<SteelItem>) => void;
  removeSteelItem: (index: number) => void;
  steelItemsLength: number;
};

// ✅ Component แยก: เรียก useSortable ที่ top level
export function SteelDetailRow({
  item,
  idx,
  jobId,
  steelOptions,
  useJob,
  patchSteelItem,
  removeSteelItem,
  steelItemsLength,
}: SteelDetailRowProps) {
  // ✅ Hook ถูกเรียกที่ top level
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${jobId}-${idx}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    scale: isDragging ? 1.02 : 1,
  };

  const normalizedSteelType = normalizeSteelCode(item.steelType);
  const isLine = item.shape === "line";
  const isManualPrice = Boolean(item.manualPrice);
  const selectedSteelOption = steelOptions.find(
    (o) => o.codeSteel === normalizedSteelType && o.shape === item.shape,
  );

  const estKg = calculateWeightDetails({
    shape: item.shape,
    amount: item.amount,
    width: item.width ?? undefined,
    length: item.length,
    thickness: item.thickness,
    density: item.density,
    price: item.price,
    discount: item.discount ?? null,
    isOD: item.isOD,
    isServices: item.isServices,
    isPerAmount: item.isPerAmount,
    weight: null,
  }).weight;

  return (
    <div
      key={`${jobId}-${idx}`}
      className="group relative"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {/* Index bubble */}
      <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex cursor-grab active:cursor-grabbing">
        {idx + 1}
      </div>

      {/* Card */}
      <div className="group relative mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 cursor-grab active:cursor-grabbing">
        <div className="flex flex-col gap-y-3">
          {/* --- ROW 1: Spec (Type, Dimensions, Qty, Weight) --- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            {/* 1) Steel Type */}
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                ชนิดเหล็ก
              </label>

              <SteelSearchSelect
                value={selectedSteelOption?.value ?? ""}
                fallbackLabel={normalizedSteelType}
                onChange={(v) => {
                  const opt = steelOptions.find((o) => o.value === v);

                  patchSteelItem(idx, {
                    steelType: opt?.codeSteel ?? normalizedSteelType,
                    shape: opt?.shape ?? item.shape ?? "square",
                    width:
                      (opt?.shape ?? item.shape) === "line"
                        ? null
                        : (item.width ?? 1),
                    price: opt?.price ?? item.price,
                    isOD: opt?.shape === "line" ? false : item.isOD,
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
                  <label className="mb-1.5 block text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    หนา
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                      value={item.thickness ?? 0}
                      onChange={(e) =>
                        patchSteelItem(idx, {
                          thickness: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      mm
                    </span>
                  </div>
                </div>

                {/* Width (only square) */}
                {!isLine && (
                  <div>
                    <label className="mb-1.5 block text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {item.isOD === true ? "ID." : "กว้าง"}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                        value={item.width ?? 0}
                        onChange={(e) =>
                          patchSteelItem(idx, {
                            width: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                        mm
                      </span>
                    </div>
                  </div>
                )}

                {/* Length */}
                <div>
                  <label className="mb-1.5 block text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {item.isOD === true ? "OD." : "ยาว"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                      value={item.length ?? 0}
                      onChange={(e) =>
                        patchSteelItem(idx, {
                          length: Math.max(0, Number(e.target.value || 0)),
                        })
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      mm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3) Quantity */}
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                จำนวน
              </label>
              <Input
                type="number"
                min={1}
                className={`h-10 w-full border-blue-200 bg-blue-50 text-center font-bold text-blue-700 shadow-sm focus-visible:ring-blue-500 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400 ${noNumberSpinnerClass}`}
                value={item.amount ?? 1}
                onChange={(e) =>
                  patchSteelItem(idx, {
                    amount: Math.max(1, Number(e.target.value || 1)),
                  })
                }
              />
            </div>

            {/* 4) Weight */}
            <div className="lg:col-span-2">
              <div>
                <label className="mb-1.5 block text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  น้ำหนักประมาณ {fmtKg(estKg)} Kg.
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    className={`h-10 border-zinc-200 bg-white pr-8 text-right font-mono text-sm hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                    value={item.weight ?? 0}
                    onChange={(e) =>
                      patchSteelItem(idx, {
                        weight: Math.max(0, Number(e.target.value || 0)),
                      })
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    Kg.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />

          {/* --- ROW 2: Job + Note + Delete --- */}
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="flex-none">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                วิธีตัด
              </label>

              <Select
                value={item.cuttingMethod ?? "normal"}
                onValueChange={(value) => {
                  patchSteelItem(idx, {
                    cuttingMethod: value as CuttingMethod,
                  });
                }}
              >
                <SelectTrigger className="h-10 w-full min-w-[140px] border-zinc-200 bg-white text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                  <SelectValue placeholder="เลือกวิธีตัด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">ตัดปกติ</SelectItem>
                  <SelectItem value="FB">F/P</SelectItem>
                  <SelectItem value="RM">R/M</SelectItem>
                  <SelectItem value="CNC">CNC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* od */}
            {!isLine && (
              <div className="flex-none">
                <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  OD
                </label>
                <button
                  type="button"
                  onClick={() => patchSteelItem(idx, { isOD: !item.isOD })}
                  disabled={isLine}
                  className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                    ${
                      item.isOD === true
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }
                    ${isLine ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center
                      ${
                        item.isOD === true
                          ? "border-blue-500 bg-blue-500"
                          : "border-zinc-300 bg-white"
                      }`}
                  >
                    {item.isOD === true && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  OD
                </button>
              </div>
            )}

            <div className="flex-none">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Service
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextIsServices = !item.isServices;
                  patchSteelItem(idx, {
                    isServices: nextIsServices,
                    isPerAmount: nextIsServices ? true : item.isPerAmount,
                  });
                }}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                  ${
                    item.isServices === true
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center
                    ${
                      item.isServices === true
                        ? "border-blue-500 bg-blue-500"
                        : "border-zinc-300 bg-white"
                    }`}
                >
                  {item.isServices === true && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                M/S
              </button>
            </div>

            <div className="flex-none">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                การคิดราคา
              </label>
              <button
                type="button"
                onClick={() =>
                  patchSteelItem(idx, {
                    isPerAmount: !item.isPerAmount,
                  })
                }
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                  ${
                    item.isPerAmount === true
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
              >
                <div
                  className={`h-4 w-4 rounded border flex items-center justify-center
                    ${
                      item.isPerAmount === true
                        ? "border-blue-500 bg-blue-500"
                        : "border-zinc-300 bg-white"
                    }`}
                >
                  {item.isPerAmount === true && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                ต่อชิ้น
              </button>
            </div>

            {/* Price */}
            <div className="w-full sm:w-40 lg:w-32 flex-none">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {item.isPerAmount === false
                  ? "ราคาต่อหน่วย (บาท)"
                  : "ราคาต่อชิ้น (บาท)"}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  value={item.price ?? 1}
                  onChange={(e) => {
                    patchSteelItem(idx, {
                      price: Math.max(0, Number(e.target.value || 0)),
                    });
                  }}
                  placeholder="0"
                  className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  ฿
                </span>
              </div>
            </div>

            {/* Discount */}
            <div className="w-full sm:w-40 lg:w-32 flex-none">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
                  className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  ฿
                </span>
              </div>
            </div>

            {/* Job */}
            {useJob && (
              <div className="w-full sm:w-28 lg:w-24 flex-none">
                <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Job No.
                </label>
                <Input
                  type="text"
                  value={item.job ?? ""}
                  onChange={(e) =>
                    patchSteelItem(idx, {
                      job: e.target.value.trim() === "" ? null : e.target.value,
                    } as any)
                  }
                  placeholder="No."
                  className="h-10 border-zinc-200 bg-white text-center dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            )}

            {/* Note */}
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
            <div className="flex-none pb-1 lg:ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSteelItem(idx)}
                disabled={steelItemsLength <= 1}
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
}
