"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  Loader2,
  Package,
  Ruler,
  DollarSign,
  Box,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { z } from "zod";

// --- Schema Definition ---
const ShapeSteelEnum = z.enum(["line", "square"]);

const SteelTypeSchema = z.object({
  codeSteel: z.string().min(1, "กรุณาระบุรหัสเหล็ก"),
  detail: z.string().optional(),
  shape: ShapeSteelEnum,
  price: z.number().min(1, "ราคาต้องไม่น้อยกว่า 1"),
  density: z.number().min(0, "กรุณาระบุความหนาแน่น"),
});

const SteelTypeSchemaWithRequirements = SteelTypeSchema.extend({
  requiresDimensions: z.boolean(),
  requiresAmount: z.boolean(),
});

export type SteelTypeForm = z.infer<typeof SteelTypeSchemaWithRequirements>;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultValues?: Partial<SteelTypeForm>;
};

export default function CreateSteelTypeModal({
  open,
  onClose,
  onCreated,
  defaultValues,
}: Props) {
  // --- Logic Section (เหมือนเดิม) ---
  const initialForm = useMemo<SteelTypeForm>(
    () => ({
      codeSteel: "",
      detail: "",
      shape: "square",
      price: 0,
      density: 0.0000079,
      requiresDimensions: true,
      requiresAmount: true,
      ...defaultValues,
    }),
    [defaultValues],
  );

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<SteelTypeForm>(initialForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof SteelTypeForm, string>>
  >({});

  const setField = <K extends keyof SteelTypeForm>(
    key: K,
    value: SteelTypeForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const reset = () => {
    setForm(initialForm);
    setFormErrors({});
  };

  const handleClose = () => {
    if (isCreating) return;
    reset();
    onClose();
  };

  const handleCreate = async () => {
    const parsed = SteelTypeSchemaWithRequirements.safeParse(form);
    if (!parsed.success) {
      const zErr: Partial<Record<keyof SteelTypeForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path?.[0] as keyof SteelTypeForm | undefined;
        if (k) zErr[k] = issue.message;
      }
      setFormErrors(zErr);
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/steelType", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const maybe = await res.json().catch(() => null);
        toast.error(maybe?.error ?? "เพิ่มประเภทเหล็กไม่สำเร็จ", {
          position: "bottom-right",
        });
        return;
      }

      toast.success("เพิ่มประเภทเหล็กสำเร็จ", { position: "bottom-right" });
      reset();
      onClose();
      onCreated?.();
    } catch (e) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", {
        position: "bottom-right",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  // --- UI Section (ปรับปรุงใหม่) ---
  return (
    // Backdrop with Blur
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header: Sticky Top */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                เพิ่มประเภทเหล็ก
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
                กรอกข้อมูลประเภทเหล็กใหม่
              </p>
            </div>
          </div>
          <button
            className="group p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-zinc-700"
            onClick={handleClose}
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
          </button>
        </div>

        {/* Body: Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Code Steel */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              รหัสเหล็ก <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                value={form.codeSteel}
                onChange={(e) => setField("codeSteel", e.target.value)}
                className={`w-full pl-3 pr-3 py-2.5 rounded-xl border bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 transition-all ${
                  formErrors.codeSteel
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                }`}
                placeholder="เช่น S45C-20MM"
                autoFocus
              />
            </div>
            {formErrors.codeSteel && (
              <p className="text-xs text-red-500 font-medium animate-pulse">
                {formErrors.codeSteel}
              </p>
            )}
          </div>

          {/* Shape & Detail Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Shape */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Box className="w-4 h-4 text-gray-400" />
                รูปร่าง <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.shape}
                  onChange={(e) =>
                    setField("shape", e.target.value as "line" | "square")
                  }
                  className="
      appearance-none w-full px-3 py-2.5 rounded-xl border
      bg-gray-50 text-gray-900
      dark:bg-zinc-900 dark:text-zinc-100
      border-gray-200 dark:border-zinc-700

      focus:outline-none focus:ring-2
      focus:ring-blue-100 dark:focus:ring-blue-900/40
      focus:border-blue-500 transition-all cursor-pointer

      [&>option]:bg-white
      [&>option]:text-gray-900
      dark:[&>option]:bg-zinc-900
      dark:[&>option]:text-zinc-100
    "
                >
                  <option value="line">เพลา (Line)</option>
                  <option value="square">แผ่น (Square)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Density */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-400" />
                ความหนาแน่น <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={form.density}
                onChange={(e) => setField("density", Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all"
                min={0}
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              ราคา/หน่วย <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setField("price", Number(e.target.value))}
                className={`[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [appearance:textfield] w-full pl-3 pr-12 py-2.5 rounded-xl border bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all ${
                  formErrors.price
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 dark:border-zinc-700 focus:border-blue-500"
                }`}
                placeholder="1.00"
                min={1}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm">THB</span>
              </div>
            </div>
            {formErrors.price && (
              <p className="text-xs text-red-500 font-medium">
                {formErrors.price}
              </p>
            )}
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ขนาดและจำนวนที่ต้องระบุ (ถ้ามี)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 px-3 py-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.requiresDimensions}
                  onChange={(e) =>
                    setField("requiresDimensions", e.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  จำเป็นต้องระบุขนาด
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 px-3 py-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.requiresAmount}
                  onChange={(e) => setField("requiresAmount", e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                  จำเป็นต้องระบุจำนวน
                </span>
              </label>
            </div>
          </div>

          {/* Detail */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={form.detail ?? ""}
              onChange={(e) => setField("detail", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all resize-none"
              placeholder="หมายเหตุ (ถ้ามี)"
              rows={3}
            />
          </div>
        </div>

        {/* Footer: Sticky Bottom */}
        <div className="p-4 sm:px-6 py-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 backdrop-blur-sm flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="relative px-6 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isCreating ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
