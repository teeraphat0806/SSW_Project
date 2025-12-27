"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus, Trash2 } from "lucide-react";

type SteelItem = {
  steeltype: string;
  quantity: number;
  width?: number | null;
  length: number;
  thickness: number;
  detail?: string | null;
  weight?: number | null;
  shape: "square" | "line";
};

type JobWithSteel = {
  id: string;
  steel: SteelItem[];
};

type SteelOption = { value: string; label: string; quantity: number };

type Props<T extends JobWithSteel> = {
  job: T;
  setJob: React.Dispatch<React.SetStateAction<T | null>>;
  steelOptions: SteelOption[];
  weightEnabled: boolean;
  className?: string;
};

export default function DetailItem<T extends JobWithSteel>({
  job,
  setJob,
  steelOptions,
  weightEnabled,
  className,
}: Props<T>) {
  const itemCount = useMemo(() => job.steel?.length ?? 0, [job.steel]);

  // ✅ เพิ่มเหล็ก
  const addSteelItem = () => {
    setJob((prev) => {
      if (!prev) return prev;

      const first = steelOptions?.[0]?.value ?? "";
      return {
        ...prev,
        steel: [
          ...prev.steel,
          {
            steeltype: first,
            quantity: 1,
            width: 0,
            length: 0,
            thickness: 0,
            detail: "",
            weight: null,
            shape: "square",
          },
        ],
      };
    });
  };

  // ✅ ลบเหล็ก
  const removeSteelItem = (index: number) => {
    setJob((prev) => {
      if (!prev) return prev;
      return { ...prev, steel: prev.steel.filter((_, i) => i !== index) };
    });
  };

  // ✅ แก้เหล็ก
  const patchSteelItem = (index: number, patch: Partial<SteelItem>) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steel: prev.steel.map((item, i) => (i === index ? { ...item, ...patch } : item)),
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
          className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มรายการ
        </Button>
      </div>

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
            <div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-center">
              {/* Item Type */}
              <div className="lg:col-span-3 lg:pl-4">
                <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400">ชนิดเหล็ก</label>
                <Select value={it.steeltype} onValueChange={(v) => patchSteelItem(idx, { steeltype: v })}>
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

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2 lg:col-span-4">
                <div>
                  <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">กว้าง</label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      value={it.width ?? 0}
                      onChange={(e) =>
                        patchSteelItem(idx, { width: Math.max(0, Number(e.target.value || 0)) })
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">ยาว</label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      value={it.length}
                      onChange={(e) =>
                        patchSteelItem(idx, { length: Math.max(0, Number(e.target.value || 0)) })
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">สูง</label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      value={it.thickness}
                      onChange={(e) =>
                        patchSteelItem(idx, { thickness: Math.max(0, Number(e.target.value || 0)) })
                      }
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                      cm
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="lg:col-span-1">
                <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">จำนวน</label>
                <div className="flex items-center justify-center">
                  <Input
                    type="number"
                    min={1}
                    className="h-9 w-full border-blue-100 bg-blue-50/50 text-center font-semibold text-blue-600 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                    value={it.quantity}
                    onChange={(e) =>
                      patchSteelItem(idx, { quantity: Math.max(1, Number(e.target.value || 1)) })
                    }
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="lg:col-span-2">
                {weightEnabled ? (
                  <div>
                    <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                      น้ำหนัก/ชิ้น
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        className="h-9 border-zinc-200 bg-white pr-8 text-right font-mono text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        value={it.weight ?? 0}
                        onChange={(e) =>
                          patchSteelItem(idx, { weight: Math.max(0, Number(e.target.value || 0)) })
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
                    <span className="text-sm italic text-zinc-300 dark:text-zinc-600">รอชั่ง</span>
                  </div>
                )}
              </div>

              {/* Note & Action */}
              <div className="lg:col-span-2">
                <label className="mb-1 block text-left text-sm text-zinc-500 dark:text-zinc-400">หมายเหตุ</label>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-9 border-zinc-200 bg-white text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="ระบุ..."
                    value={it.detail ?? ""}
                    onChange={(e) => patchSteelItem(idx, { detail: e.target.value })}
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

      <button
        type="button"
        onClick={addSteelItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
      </button>
    </section>
  );
}
