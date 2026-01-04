"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListChecks, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
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
import { is } from "date-fns/locale";

type SteelItem = {
  id: number;
  steeltype: string;
  quantity: number;
  width?: number | null;
  length: number;
  thickness: number;
  detail?: string | null;
  weight?: number | null;
  shape: "square" | "line";
};

type SteelOption = {
  value: string;
  label: string;
  quantity: number;
  shape: "square" | "line";
};

// ✅ job ต้องมีอย่างน้อย id + steel
type JobWithSteel = {
  id: string | number;
  steel: SteelItem[];
};

// ✅ รับ job เป็น null ได้ (ตรงกับ parent)
type Props<T extends JobWithSteel> = {
  job: T | null;
  setJob: React.Dispatch<React.SetStateAction<T | null>>;
  steelOptions: SteelOption[];
  weightEnabled: boolean;
  className?: string;
};

const shapeText = (s: "square" | "line") => (s === "line" ? "เพลา" : "แผ่น");

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
            "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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
          "dark:border-zinc-700 dark:bg-zinc-900"
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
                          isSelected ? "opacity-100" : "opacity-0"
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
}: Props<T>) {
  const itemCount = useMemo(() => job?.steel?.length ?? 0, [job?.steel]);

  // ✅ กัน null ก่อน (ไม่งั้น job.steel จะพัง)
  if (!job) {
    return (
      <section className={["space-y-3", className ?? ""].join(" ")}>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          กำลังโหลดข้อมูล...
        </div>
      </section>
    );
  }

  // ✅ เพิ่มเหล็ก
  const addSteelItem = () => {
    setJob((prev) => {
      if (!prev) return prev;

      const firstOpt = steelOptions?.[0];
      const firstType = firstOpt?.value ?? "";
      const firstShape: "square" | "line" = firstOpt?.shape ?? "square";

      return {
        ...prev,
        steel: [
          ...(prev.steel ?? []),
          {
            steeltype: firstType,
            quantity: 1,
            width: firstShape === "line" ? null : 0,
            length: 0,
            thickness: 0,
            detail: "",
            weight: null,
            shape: firstShape,
          },
        ],
      };
    });
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
          i === index ? { ...item, ...patch } : item
        ),
      };
    });
  };

  return (
    <section className={["space-y-3", className ?? ""].join(" ")}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-500" />
          รายการสินค้า
          <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
            {itemCount} รายการ
          </span>
        </h2>

        <Button
          onClick={addSteelItem}
          size="sm"
          disabled={steelOptions.length === 0}
          className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มรายการ
        </Button>
      </div>

      {(job.steel ?? []).map((it, idx) => {
        const isLine = it.shape === "line";
        return (
          <div
            key={`${job.id}-${idx}`}
            className="group relative rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
              {idx + 1}
            </div>

            <div className="p-4 lg:flex lg:items-center lg:gap-4 lg:p-1">
              <div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-center">
                {/* Steel Type (searchable) */}
                <div className="lg:col-span-3 lg:pl-4">
                  <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400">
                    ชนิดเหล็ก
                  </label>

                  <SteelSearchSelect
                    value={it.steeltype}
                    onChange={(v) => {
                      const opt = steelOptions.find((o) => o.value === v);
                      setJob((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          steel: (prev.steel ?? []).map((item, i) => {
                            if (i !== idx) return item;
                            const nextShape =
                              opt?.shape ?? item.shape ?? "square";
                            return {
                              ...item,
                              steeltype: v,
                              shape: nextShape,
                              width:
                                nextShape === "line" ? null : item.width ?? 0,
                            };
                          }),
                        };
                      });
                    }}
                    options={steelOptions}
                    disabled={steelOptions.length === 0}
                  />
                </div>

                {/* Dimensions */}

                <div
                  className={cn(
                    "grid gap-2 lg:col-span-4",
                    isLine ? "grid-cols-2" : "grid-cols-3"
                  )}
                >
                  <div>
                    <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                      หนา
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        value={it.thickness ?? 0}
                        onChange={(e) =>
                          patchSteelItem(idx, {
                            thickness: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                        mm
                      </span>
                    </div>
                  </div>
                  {!isLine && (
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
                          mm
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                      ยาว
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        value={it.length ?? 0}
                        onChange={(e) =>
                          patchSteelItem(idx, {
                            length: Math.max(0, Number(e.target.value || 0)),
                          })
                        }
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                        mm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="lg:col-span-1">
                  <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                    จำนวน
                  </label>
                  <Input
                    type="number"
                    min={1}
                    className="h-9 w-full border-blue-100 bg-blue-50/50 text-center font-semibold text-blue-600 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                    value={it.quantity ?? 1}
                    onChange={(e) =>
                      patchSteelItem(idx, {
                        quantity: Math.max(1, Number(e.target.value || 1)),
                      })
                    }
                  />
                </div>

                {/* Weight */}
                <div className="lg:col-span-2">
                  {weightEnabled ? (
                    <div>
                      <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                        น้ำหนักท/กก.
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          className="h-9 border-zinc-200 bg-white pr-8 text-right font-mono text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          value={it.weight ?? 0}
                          onChange={(e) =>
                            patchSteelItem(idx, {
                              weight: Math.max(0, Number(e.target.value || 0)),
                            })
                          }
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
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

                {/* Note + Delete */}
                <div className="lg:col-span-2">
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
        );
      })}

      <button
        type="button"
        onClick={addSteelItem}
        disabled={steelOptions.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
      </button>
    </section>
  );
}
