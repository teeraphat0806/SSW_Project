"use client";

import React, { useMemo, useState } from "react";
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
  CalendarDays,
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
import { ToastContainer, toast } from "react-toastify";

// import { ShapeSteel } from "@prisma/client";
import { ShapeSteel, CuttingMethod } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateBillSummary,
  calculateWeightDetails,
} from "@/lib/calculateGrandTotal";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SteelDetailRow } from "@/components/up-date-order/SteelDetailRow";

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

//  job ต้องมีอย่างน้อย id + steel
type JobWithSteel = {
  id: string | number;
  poNumber: string;
  deliveryDate: string;
  createdAt: string;
  credit: number;
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

const shapeText = (s: ShapeSteel) => (s === "line" ? "เพลา" : "แผ่น");

const fmtKg = (n: number) =>
  Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// ฟังก์ชั่นช่วยแปลงวันที่ให้เป็นรูปแบบที่ input[type="date"] ต้องการ (YYYY-MM-DD)
const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const directIso = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (directIso?.[1]) return directIso[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

// ฟังก์ชั่นช่วยแปลงวันที่ให้เป็นรูปแบบ วัน/เดือน/ปี (D/M/YYYY) หรือแสดง "วัน/เดือน/ปี" ถ้าแปลงไม่ได้
const toDayMonthYear = (value?: string | null) => {
  const iso = toDateInputValue(value);
  if (!iso) return "วัน/เดือน/ปี";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "วัน/เดือน/ปี";
  return `${day}/${month}/${year}`;
};

//
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
  const [open, setOpen] = useState(false);

  const selectedOpt = options.find((o) => o.value === value);
  const selectedLabel = selectedOpt
    ? `${selectedOpt.label} (${shapeText(selectedOpt.shape)})`
    : fallbackLabel
      ? fallbackLabel
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
          <CommandList className="max-h-48 overflow-y-auto">
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
                      (คงเหลือ {opt.amount})
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

  // ✅ Setup dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const steelIds = useMemo(
    () => (job?.steel ?? []).map((_, idx) => `${job?.id}-${idx}`),
    [job?.steel, job?.id],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !job) return;
    if (active.id === over.id) return;

    setJob((prev) => {
      if (!prev) return prev;
      const oldIndex = (prev.steel ?? []).findIndex(
        (_, idx) => `${prev.id}-${idx}` === active.id,
      );
      const newIndex = (prev.steel ?? []).findIndex(
        (_, idx) => `${prev.id}-${idx}` === over.id,
      );
      if (oldIndex === -1 || newIndex === -1) return prev;

      return {
        ...prev,
        steel: arrayMove(prev.steel ?? [], oldIndex, newIndex),
      };
    });
  }

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
  const noNumberSpinnerClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const preventWheelChangeOnNumberInput = (
    e: React.WheelEvent<HTMLElement>,
  ) => {
    const target = e.target;
    if (
      target instanceof HTMLInputElement &&
      target.type === "number" &&
      document.activeElement === target
    ) {
      target.blur();
    }
  };
  // ✅ เพิ่มเหล็ก
  const addSteelItem = () => {
    setJob((prev) => {
      if (!prev) return prev;

      const firstOpt = steelOptions?.[0];
      const firstType = firstOpt?.codeSteel ?? "";
      const firstprice = firstOpt?.price ?? 0;
      const firstShape: ShapeSteel = firstOpt?.shape ?? "square";

      return {
        ...prev,
        steel: [
          ...(prev.steel ?? []),
          {
            steelType: firstType,
            amount: 1,
            width: firstShape === "line" ? null : 0,
            length: 0,
            thickness: 0,
            detail: "",
            weight: null,
            job: null,
            cuttingMethod: "normal",
            shape: firstShape,
            price: firstprice,
            discount: null,
            manualPrice: false,
            density: DEFAULT_DENSITY,
            isOD: false,
            isServices: false,
            isPerAmount: false,
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

  const copySteelItem = (index: number) => {
    const steelList = job?.steel ?? [];
    //ตรวจดูว่าเกิน15มั้ย
    if ((job?.steel?.length ?? 0) >= MAX_ITEMS) {
      toast.error(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`, {
        position: "bottom-right",
      });
      return;
    }
    //หา item ที่จะคัดลอก
    const source = steelList[index];
    if(!source) return;

    //แยก id ออกเพื่อไม่ให้ซ้ำกับ item ที่มีอยู่แล้ว
    const { id, ...itemWithoutId } = source;
    
    setJob((prev) => {
      if (!prev) return prev;
      return{
        ...prev,
        steel: [...(prev.steel ?? []), itemWithoutId as SteelItem]
      }
    })

  }

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
    <section
      className="space-y-3"
      onWheelCapture={preventWheelChangeOnNumberInput}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-500" />
          รายการเหล็ก
          <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
            {itemCount} รายการ
          </span>
        </h2>

        <div className="flex flex-wrap items-end gap-2">
          {/* Toggle Job */}
          <Button
            type="button"
            variant={useJob ? "default" : "outline"}
            onClick={() => {
              setUseJob((prev) => !prev);
            }}
            className={[
              "h-10 shrink-0 rounded-xl",
              useJob
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/40",
            ].join(" ")}
          >
            <Layers className="mr-2 h-4 w-4" />
            {useJob ? "กำลังกรอก Job" : "กรอก Job"}
          </Button>

          {/* credit */}
          <div className="w-[80px] shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Credit (วัน)
            </label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={job.credit ?? 30}
              onChange={(e) => {
                const next = Math.max(0, Number(e.target.value || 0));
                setJob((prev) => (prev ? { ...prev, credit: next } : prev));
              }}
              className={`h-10 w-full border-zinc-200 bg-white text-center font-semibold tabular-nums focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
            />
          </div>

          {/* PO Number */}
          <div className="w-[150px] shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              PO Number
            </label>
            <Input
              type="text"
              value={job.poNumber ?? ""}
              onChange={(e) =>
                setJob((prev) =>
                  prev ? { ...prev, poNumber: e.target.value } : prev,
                )
              }
              placeholder="เช่น PO-2026-001"
              className="h-10 w-full border-zinc-200 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {/* Bill Created Date */}
          <div className="relative w-[130px] shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              วันที่สร้างบิล
            </label>
            <Input
              type="date"
              value={toDateInputValue(job.createdAt)}
              onChange={(e) =>
                setJob((prev) =>
                  prev ? { ...prev, createdAt: e.target.value } : prev,
                )
              }
              className="absolute bottom-0 left-0 z-10 h-10 w-full cursor-pointer opacity-0"
            />
            <div className="pointer-events-none h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex h-full items-center justify-between">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {toDayMonthYear(job.createdAt)}
                </span>
                <CalendarDays className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Delivery Date */}
          <div className="relative w-[130px] shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-zinc-500 dark:text-zinc-400">
              กำหนดส่งสินค้า
            </label>
            <Input
              type="date"
              value={toDateInputValue(job.deliveryDate)}
              onChange={(e) =>
                setJob((prev) =>
                  prev ? { ...prev, deliveryDate: e.target.value } : prev,
                )
              }
              className="absolute bottom-0 left-0 z-10 h-10 w-full cursor-pointer opacity-0"
            />
            <div className="pointer-events-none h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex h-full items-center justify-between">
                <span className="text-zinc-900 dark:text-zinc-100">
                  {toDayMonthYear(job.deliveryDate)}
                </span>
                <CalendarDays className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Add */}
          <Button
            type="button"
            onClick={addSteelItemLimited}
            disabled={
              steelOptions.length === 0 || job.steel.length >= MAX_ITEMS
            }
            className="h-10 shrink-0 rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steelIds}
            strategy={verticalListSortingStrategy}
          >
            {job.steel?.map((item, idx) => (
              <SteelDetailRow
                key={`${job.id}-${idx}`}
                item={item}
                idx={idx}
                jobId={job.id}
                steelOptions={steelOptions}
                useJob={useJob}
                patchSteelItem={patchSteelItem}
                onCopyItem={copySteelItem}
                removeSteelItem={removeSteelItem}
                steelItemsLength={job.steel.length}
              />
            ))}

            {/* Empty state */}
            {job.steel.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-950/20 dark:text-zinc-500 dark:border-zinc-800">
                <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p>ยังไม่มีรายการเหล็ก กดปุ่ม "เพิ่ม" เพื่อเริ่มรายการ</p>
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
