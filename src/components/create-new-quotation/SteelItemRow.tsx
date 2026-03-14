// src/components/newJobOrder/SteelItemRow.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, CheckIcon, Copy } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";
import { ShapeSteel, CuttingMethod } from "@/types";
import { SteelItem, SteelType } from "@/app/create-new-quotation/page";

type SteelItemRowProps = {
  item: SteelItem;
  idx: number;
  steelTypes: SteelType[];
  searchItem: string;
  setsearchItem: (val: string) => void;
  loadingSteel: boolean;
  updateSteelItem: <K extends keyof SteelItem>(
    id: string,
    field: K,
    value: SteelItem[K],
  ) => void;
  onCopyItem: (id: string) => void;
  removeSteelItem: (id: string) => void;
  steelItemsLength: number;
};

const noNumberSpinnerClass =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export function SteelItemRow({
  item,
  idx,
  steelTypes,
  searchItem,
  setsearchItem,
  loadingSteel,
  updateSteelItem,
  onCopyItem,
  removeSteelItem,
  steelItemsLength,
}: SteelItemRowProps) {
  // ✅ Hook ถูกเรียกที่ top level ของ component
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    scale: isDragging ? 1.35 : 1,
  };

  const isLine = item.shape === "line";
  const selectedType = steelTypes.find(
    (t) => t.steelType === item.steelType && t.shape === item.shape,
  );
  const selectedValue = selectedType ? String(selectedType.id) : "";

  const fmtKg = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const estKg = calculateWeightDetails({
    shape: item.shape,
    amount: item.amount,
    width: item.wide ?? undefined,
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
      className="group relative"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
        {idx + 1}
      </div>

      <div className="group relative mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-y-3">
          {/* --- ROW 1: ข้อมูลสเปคเหล็ก --- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            {/* 1. Steel Type */}
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ประเภทเหล็ก
              </label>
              <Select
                value={selectedValue}
                onValueChange={(value) => {
                  const selected = steelTypes.find(
                    (t) => String(t.id) === value,
                  );
                  if (selected) {
                    updateSteelItem(item.id, "SteelId", Number(selected.id));
                    updateSteelItem(item.id, "steelType", selected.steelType);
                    updateSteelItem(item.id, "shape", selected.shape);
                    updateSteelItem(
                      item.id,
                      "price",
                      Number(selected.price ?? 0),
                    );
                    updateSteelItem(
                      item.id,
                      "density",
                      Number(selected.density ?? item.density ?? 0),
                    );
                    if (selected.shape === "line") {
                      updateSteelItem(item.id, "wide", null);
                      updateSteelItem(item.id, "isOD", false);
                    }
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full border-zinc-200 bg-zinc-50/50 text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <Input
                      placeholder="🔍 ค้นหา..."
                      value={searchItem}
                      onChange={(e) => setsearchItem(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  {loadingSteel ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      กำลังโหลด...
                    </div>
                  ) : steelTypes.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      ไม่พบข้อมูล
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {steelTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          <span className="font-medium">{type.steelType}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {type.shape === "square"
                              ? "(แผ่น)"
                              : type.shape === "line"
                                ? "(เพลา)"
                                : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Dimensions */}
            <div className="lg:col-span-5">
              <div
                className={`grid gap-2 ${
                  isLine ? "grid-cols-2" : "grid-cols-3"
                }`}
              >
                {/* Thickness */}
                <div>
                  <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {isLine ? "กลม" : "หนา"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                      value={item.thickness ?? 0}
                      onChange={(e) =>
                        updateSteelItem(
                          item.id,
                          "thickness",
                          Math.max(0, Number(e.target.value || 0)),
                        )
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      mm
                    </span>
                  </div>
                  {item.cuttingMethod === "FB" && (
                    <div className="mt-1 flex gap-1 animate-in fade-in slide-in-from-top-1">
                      <select
                        className="w-1/2 h-7 text-[10px] border rounded bg-zinc-50 dark:bg-zinc-800"
                        value={item.surfaceT ?? ""}
                        onChange={(e) =>
                          updateSteelItem(item.id, "surfaceT", e.target.value)
                        }
                      >
                        <option value="">เลือกsurface</option>
                        <option value="v">v</option>
                        <option value="vv">vv</option>
                        <option value="vvv">vvv</option>
                      </select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="เผื่อ"
                        className={`w-1/2 h-7 text-[10px] text-center px-1 ${noNumberSpinnerClass}`}
                        value={item.toleranceT ?? ""}
                        onChange={(e) =>
                          updateSteelItem(
                            item.id,
                            "toleranceT",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Width */}
                {!isLine && (
                  <div>
                    <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {item.isOD === true ? "OD." : "กว้าง"}
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                        value={item.wide ?? 0}
                        onChange={(e) =>
                          updateSteelItem(
                            item.id,
                            "wide",
                            Math.max(0, Number(e.target.value || 0)),
                          )
                        }
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        mm
                      </span>
                    </div>
                    {item.cuttingMethod === "FB" && (
                      <div className="mt-1 flex gap-1 animate-in fade-in slide-in-from-top-1">
                        <select
                          className="w-1/2 h-7 text-[10px] border rounded bg-zinc-50 dark:bg-zinc-800"
                          value={item.surfaceW ?? ""}
                          onChange={(e) =>
                            updateSteelItem(item.id, "surfaceW", e.target.value)
                          }
                        >
                          <option value="">เลือกsurface</option>
                          <option value="v">v</option>
                          <option value="vv">vv</option>
                          <option value="vvv">vvv</option>
                        </select>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="เผื่อ"
                          className={`w-1/2 h-7 text-[10px] text-center px-1 ${noNumberSpinnerClass}`}
                          value={item.toleranceW ?? ""}
                          onChange={(e) =>
                            updateSteelItem(
                              item.id,
                              "toleranceW",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Length */}
                <div>
                  <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.isOD === true ? "ID." : "ยาว"}
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                      value={item.length ?? 0}
                      onChange={(e) =>
                        updateSteelItem(
                          item.id,
                          "length",
                          Math.max(0, Number(e.target.value || 0)),
                        )
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                      mm
                    </span>
                  </div>
                  {item.cuttingMethod === "FB" && (
                    <div className="mt-1 flex gap-1 animate-in fade-in slide-in-from-top-1">
                      <select
                        className="w-1/2 h-7 text-[10px] border rounded bg-zinc-50 dark:bg-zinc-800"
                        value={item.surfaceL ?? ""}
                        onChange={(e) =>
                          updateSteelItem(item.id, "surfaceL", e.target.value)
                        }
                      >
                        <option value="">เลือกsurface</option>
                        <option value="v">v</option>
                        <option value="vv">vv</option>
                        <option value="vvv">vvv</option>
                      </select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="เผื่อ"
                        className={`w-1/2 h-7 text-[10px] text-center px-1 ${noNumberSpinnerClass}`}
                        value={item.toleranceL ?? ""}
                        onChange={(e) =>
                          updateSteelItem(
                            item.id,
                            "toleranceL",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}

                  {/* จบขนาด */}
                </div>
              </div>
            </div>

            {/* 3. Quantity */}
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                จำนวน
              </label>
              <Input
                type="number"
                min={0}
                className={`h-10 w-full border-blue-200 bg-blue-50 text-center font-bold text-blue-700 shadow-sm focus-visible:ring-blue-500 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400 ${noNumberSpinnerClass}`}
                value={item.amount ?? 1}
                onChange={(e) =>
                  updateSteelItem(
                    item.id,
                    "amount",
                    Math.max(1, Number(e.target.value || 1)),
                  )
                }
              />
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                น้ำหนักประมาณ {fmtKg(estKg)} Kg.
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  className={`h-10 border-zinc-200 bg-white pr-8 text-right font-mono text-sm hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                  value={item.weight ?? 0}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "weight",
                      Math.max(0, Number(e.target.value || 0)),
                    )
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  Kg.
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />

          {/* --- ROW 2: รายละเอียดเพิ่มเติม --- */}
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            {/* Cutting Method */}
            <div className="flex-none">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                วิธีตัด
              </label>
              <Select
                value={item.cuttingMethod ?? "normal"}
                onValueChange={(value) =>
                  updateSteelItem(
                    item.id,
                    "cuttingMethod",
                    value as CuttingMethod,
                  )
                }
              >
                <SelectTrigger className="h-10 w-full min-w-[160px] border-zinc-200 bg-white text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
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

            {/* OD Button */}
            {!isLine && (
              <div className="flex-none">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  OD
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateSteelItem(
                      item.id,
                      "isOD",
                      item.isOD === true ? false : true,
                    )
                  }
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

            {/* Services Button */}
            <div className="flex-none">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Services
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextIsServices = !item.isServices;
                  updateSteelItem(item.id, "isServices", nextIsServices);
                  updateSteelItem(
                    item.id,
                    "isPerAmount",
                    nextIsServices ? true : item.isPerAmount,
                  );
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

            {/* Price Calculation Button */}
            <div className="flex-none">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                การคิดราคา
              </label>
              <button
                type="button"
                onClick={() =>
                  updateSteelItem(item.id, "isPerAmount", !item.isPerAmount)
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
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.isPerAmount === false
                  ? "ราคาต่อหน่วย (บาท)"
                  : "ราคาต่อชิ้น (บาท)"}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={item.price ?? 0}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "price",
                      Math.max(0, Number(e.target.value || 0)),
                    )
                  }
                  placeholder="0"
                  className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  ฿
                </span>
              </div>
            </div>

            {/* Discount */}
            <div className="w-full sm:w-40 lg:w-32 flex-none">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ส่วนลด (บาท)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={item.discount ?? ""}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "discount",
                      e.target.value === ""
                        ? null
                        : Math.max(0, Number(e.target.value)),
                    )
                  }
                  placeholder="0"
                  className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  ฿
                </span>
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                หมายเหตุ
              </label>
              <Input
                value={item.detail || ""}
                onChange={(e) =>
                  updateSteelItem(item.id, "detail", e.target.value)
                }
                placeholder="รายละเอียดเพิ่มเติม..."
                className="h-10 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            {/* Copy + Delete Button */}
            <div className="flex-none pb-1 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={steelItemsLength >= 15}
                onClick={() => onCopyItem(item.id)}
                className="h-9 w-9 text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                title="คัดลอกรายการ"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSteelItem(item.id)}
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
