"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  Save,
  AlertCircle,
  PackageMinus,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { set, z } from "zod";
import { th } from "date-fns/locale";

// --- Type Definitions ---
type SteelStock = {
  id: number;
  width: number | null;
  length: number;
  thickness: number;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type SteelTypeDetail = {
  id: number;
  codeSteel: string;
  detail?: string | null;
  amount: number;
  shape: "square" | "line";
  price: number;
  status: "active" | "inactive" | string;
  density: number;
  createdAt: string;
  updatedAt: string;
  SteelStock: SteelStock[];
};

// --- Schema Validation ---
const EditSchema = z.object({
  codeSteel: z.string().min(1, "กรุณาระบุรหัสเหล็ก"),
  detail: z.string().optional(),
  price: z.number().min(0, "ราคาต้องไม่น้อยกว่า 0"),
  density: z.number().min(0, "กรุณาระบุความหนาแน่น"),
  status: z.enum(["active", "inactive"]),
});

type EditForm = z.infer<typeof EditSchema>;

export default function SteelTypeDetailModal({
  open,
  steelTypeId,
  onClose,
  onUpdated,
}: {
  open: boolean;
  steelTypeId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SteelTypeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Edit
  const [form, setForm] = useState<EditForm>({
    codeSteel: "",
    detail: "",
    price: 0,
    density: 0,
    status: "active",
  });
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof EditForm, string>>
  >({});

  // Picking State (สำหรับการเบิก)
  const [pickingStock, setPickingStock] = useState<SteelStock | null>(null); // เก็บ Stock ที่กำลังจะเบิก
  const [pickQty, setPickQty] = useState<number>(1);
  const [processingPick, setProcessingPick] = useState(false);

  // State สำหรับสินค้ารับเข้า
  const [showInModal, setShowInModal] = useState(false);
  const [submittingIn, setSubmittingIn] = useState(false);

  const [displayUnit, setDisplayUnit] = useState<"mm" | "cm" | "m">("mm");

  // --- ส่วนของ JSX ---
  const [inForm, setInForm] = useState({
    thickness: "",
    width: "",
    length: "",
    quantity: 1,
    unit: "mm" as "mm" | "cm" | "m", // Default เป็น mm
  });

  // ฟังก์ชันช่วยแปลงค่าหน่วยเป็น mm
  const toMM = (value: number, unit: "mm" | "cm" | "m") => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return null;
    if (unit === "cm") return num * 10;
    if (unit === "m") return num * 1000;
    return num;
  };

  // Base unit = mm
  const formatValue = (value: number | null) => {
    if (value === null) return "-";
    const multipliers = { mm: 1, cm: 10, m: 1000 };
    const converted = value / multipliers[displayUnit];

    const fraction = displayUnit === "m" ? 3 : displayUnit === "cm" ? 1 : 0;

    return converted.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
  };

  // --- Helpers สำหรับฟอร์มแก้ไข ---
  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const sizeLabel = useMemo(() => {
    if (!data) return "";
    if (data.shape === "square") return "หนา × กว้าง × ยาว";
    return "หนา × ยาว (เหล็กเส้น)";
  }, [data]);

  // --- Fetch Data ---
  const fetchData = async () => {
    if (!steelTypeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/steelType/${steelTypeId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json: SteelTypeDetail = await res.json();
      setData(json);

      // Fill form with current data
      setForm({
        codeSteel: json.codeSteel ?? "",
        detail: json.detail ?? "",
        price: Number(json.price ?? 0),
        density: Number(json.density ?? 0),
        status: (json.status as any) === "inactive" ? "inactive" : "active",
      });
    } catch (e: any) {
      setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && steelTypeId) {
      setDisplayUnit("mm");
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, steelTypeId]);

  useEffect(() => {
    if (showInModal) {
      setInForm((prev) => ({ ...prev, unit: "mm" }));
    }
  }, [showInModal]);

  const handleStockIn = async () => {
    if (!steelTypeId || !data) return;

    // Validate เบื้องต้น
    if (!inForm.thickness || !inForm.length || inForm.quantity <= 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (data.shape === "square" && !inForm.width) {
      toast.error("กรุณากรอกความกว้าง");
      return;
    }

    setSubmittingIn(true);
    try {
      const payload = {
        quantity: Number(inForm.quantity),
        thickness: toMM(Number(inForm.thickness), inForm.unit),
        length: toMM(Number(inForm.length), inForm.unit),
        width:
          data?.shape === "square"
            ? toMM(Number(inForm.width), inForm.unit)
            : null,
      };

      const res = await fetch(`/api/steelType/${steelTypeId}/in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "เพิ่มสต็อกไม่สำเร็จ");
      }

      toast.success("เพิ่มสต็อกสำเร็จ", { position: "bottom-right" });
      setInForm({
        thickness: "",
        width: "",
        length: "",
        quantity: 1,
        unit: "mm",
      });
      setShowInModal(false);

      // รีเฟรชข้อมูล
      onUpdated?.();
      await fetchData();
    } catch (err) {
      toast.error((err as any).message || "เพิ่มสต็อกไม่สำเร็จ", {
        position: "bottom-right",
      });
    } finally {
      setSubmittingIn(false);
    }
  };

  //ดูว่าจะแก้ไขหรือไม่
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormErrors({});
    if (data) {
      setForm({
        codeSteel: data.codeSteel ?? "",
        detail: data.detail ?? "",
        price: Number(data.price ?? 0),
        density: Number(data.density ?? 0),
        status: (data.status as any) === "inactive" ? "inactive" : "active",
      });
    }
  };

  // --- Handlers: Save Edit ---
  const handleSaveEdit = async () => {
    const parsed = EditSchema.safeParse(form);
    if (!parsed.success) {
      const zErr: Partial<Record<keyof EditForm, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path?.[0] as keyof EditForm | undefined;
        if (k) zErr[k] = issue.message;
      }
      setFormErrors(zErr);
      return;
    }
    if (!steelTypeId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/steelType/${steelTypeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const maybe = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 409 && maybe?.code === "CODE_STEEL_DUPLICATE") {
          setFormErrors((prev) => ({
            ...prev,
            codeSteel: "รหัสเหล็กนี้มีอยู่แล้ว",
          }));
          toast.error("รหัสเหล็กซ้ำในระบบ", { position: "bottom-right" });
          return;
        }
        throw new Error(maybe?.error ?? "บันทึกไม่สำเร็จ");
      }

      toast.success("บันทึกข้อมูลสำเร็จ", { position: "bottom-right" });
      setIsEditing(false);
      onUpdated?.();

      // Update local data without full reload if possible, or just re-fetch
      setData((prev) => (prev ? { ...prev, ...parsed.data } : prev));
    } catch (err: any) {
      toast.error(err.message, { position: "bottom-right" });
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers: Pick Stock (เบิก) ---
  const openPickModal = (stock: SteelStock) => {
    setPickingStock(stock);
    setPickQty(1); // Reset default quantity
  };

  const closePickModal = () => {
    setPickingStock(null);
    setProcessingPick(false);
  };

  const handleConfirmPick = async () => {
    if (!pickingStock || !steelTypeId) return;

    if (pickQty <= 0) {
      toast.error("จำนวนต้องมากกว่า 0", { position: "bottom-right" });
      return;
    }
    if (pickQty > pickingStock.quantity) {
      toast.error("จำนวนที่เบิกเกินกว่าที่มีในสต็อก", {
        position: "bottom-right",
      });
      return;
    }

    setProcessingPick(true);
    try {
      const res = await fetch(`/api/steelType/${steelTypeId}/out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steelStockId: pickingStock.id,
          quantity: pickQty,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "เบิกสินค้าไม่สำเร็จ");
      }

      toast.success("เบิกสินค้าสำเร็จ", { position: "bottom-right" });
      onUpdated?.(); // แจ้ง parent ว่ามี data เปลี่ยน
      await fetchData(); // โหลดข้อมูลใหม่เพื่ออัปเดตตาราง Stock
      closePickModal();
    } catch (err: any) {
      toast.error(err.message, { position: "bottom-right" });
    } finally {
      setProcessingPick(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div>
            <div className="text-xl font-bold flex items-center gap-2">
              <PackageMinus className="w-6 h-6 text-blue-600" />
              รายละเอียดและจัดการสต็อก
            </div>
            {data && (
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                ID: {data.id} • {data.codeSteel} • {data.shape}
              </div>
            )}
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={onClose}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
              <AlertCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* --- LEFT COLUMN: View/Edit Form (4 cols) --- */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 p-5 h-full flex flex-col">
                  {/* Header & Toggle Button */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      ข้อมูลทั่วไป
                      {isEditing && (
                        <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          กำลังแก้ไข
                        </span>
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        //className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        className="text-sm bg-blue-600 text-white  flex items-center gap-1 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                      >
                        <Pencil className="w-4 h-4" />
                        แก้ไข
                      </button>
                    )}
                  </div>

                  {/* --- MODE: VIEW (แสดงผลอย่างเดียว) --- */}
                  {!isEditing ? (
                    <div className="space-y-6 flex-1">
                      {/* Code & Status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">
                            รหัสเหล็ก
                          </div>
                          <div className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
                            {form.codeSteel +
                              " " +
                              (data.shape === "square" ? "(แผ่น)" : "(เพลา)")}
                          </div>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium border ${
                              form.status === "active"
                                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50"
                                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                            }`}
                          >
                            {form.status === "active" ? "● ใช้งาน" : "● ยกเลิก"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">
                            ราคา/หน่วย
                          </div>
                          <div className="font-semibold text-lg">
                            {form.price.toLocaleString()}{" "}
                            <span className="text-sm font-normal text-gray-400">
                              บาท
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">
                            ความหนาแน่น
                          </div>
                          <div className="font-semibold text-lg">
                            {form.density}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
                          รายละเอียดเพิ่มเติม
                        </div>
                        <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-800 text-sm text-gray-600 dark:text-zinc-300 min-h-[80px]">
                          {form.detail || "- ไม่ระบุ -"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* --- MODE: EDIT (ฟอร์มแก้ไข) --- */
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Code */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                          รหัสเหล็ก <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={form.codeSteel}
                          onChange={(e) =>
                            setField("codeSteel", e.target.value.toUpperCase())
                          }
                          className={`mt-1 w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                            formErrors.codeSteel
                              ? "border-red-500"
                              : "border-gray-200 dark:border-zinc-700"
                          }`}
                        />
                        {formErrors.codeSteel && (
                          <p className="text-sm text-red-500 mt-1">
                            {formErrors.codeSteel}
                          </p>
                        )}
                      </div>

                      {/* Price & Density */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                            ราคา/หน่วย
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(e) =>
                              setField("price", parseFloat(e.target.value))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                            ความหนาแน่น
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            min={0}
                            value={form.density}
                            onChange={(e) =>
                              setField("density", parseFloat(e.target.value))
                            }
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                          สถานะ
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) =>
                            setField(
                              "status",
                              e.target.value as "active" | "inactive",
                            )
                          }
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="active">🟢 ใช้งาน (Active)</option>
                          <option value="inactive">🔴 ยกเลิก (Inactive)</option>
                        </select>
                      </div>

                      {/* Detail */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                          รายละเอียดเพิ่มเติม
                        </label>
                        <textarea
                          rows={3}
                          value={form.detail ?? ""}
                          onChange={(e) => setField("detail", e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                      </div>

                      {/* Action Buttons (Save/Cancel) */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium transition-all"
                        >
                          ยกเลิก
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          บันทึก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* --- RIGHT COLUMN: Stock Table (8 cols) --- */}

              <div className="lg:col-span-8">
                <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full shadow-sm overflow-hidden">
                  {/* Header Section */}
                  <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/50">
                    <div>
                      <div className="font-bold text-xl text-gray-900 dark:text-white">
                        รายการสต็อก
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        รวมทั้งหมด:{" "}
                        {data.SteelStock.reduce((a, b) => a + b.quantity, 0)}{" "}
                        ชิ้น{" "}
                        {data.shape === "square"
                          ? "หนา × กว้าง × ยาว"
                          : "กลม × ยาว"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Unit Switcher */}
                      <div className="flex bg-gray-200 dark:bg-zinc-800 p-1 rounded-xl">
                        {(["m", "cm", "mm"] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => setDisplayUnit(u)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              displayUnit === u
                                ? "bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:text-zinc-400"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowInModal(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        รับเข้าเพิ่ม
                      </button>
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-zinc-950/50 text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-bold text-[11px] border-b border-gray-100 dark:border-zinc-800">
                        <tr>
                          <th className="px-6 py-4">
                            ขนาดสินค้า ({displayUnit})
                          </th>
                          <th className="px-6 py-4 text-right">จำนวนคงเหลือ</th>
                          <th className="px-6 py-4 text-center">
                            อัปเดตล่าสุด
                          </th>
                          <th className="px-6 py-4 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {data.SteelStock.length > 0 ? (
                          data.SteelStock.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-blue-50/30 dark:hover:bg-emerald-500/5 transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {data.shape === "square" ? (
                                    <span className="flex items-center gap-1.5">
                                      {formatValue(item.thickness)}
                                      <span className="text-gray-400 font-normal">
                                        ×
                                      </span>
                                      {formatValue(item.width)}
                                      <span className="text-gray-400 font-normal">
                                        ×
                                      </span>
                                      {formatValue(item.length)}
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-gray-400">Ø</span>
                                      {formatValue(item.thickness)}
                                      <span className="text-gray-400 font-normal">
                                        ×
                                      </span>
                                      {formatValue(item.length)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-full font-black text-xs ${
                                    item.quantity > 5
                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  }`}
                                >
                                  {item.quantity.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center text-gray-500 dark:text-zinc-500 text-xs">
                                {new Date(item.updatedAt).toLocaleDateString(
                                  "th-TH",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => openPickModal(item)}
                                  disabled={item.quantity <= 0}
                                  className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                  เบิกออก
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center">
                              <div className="flex flex-col items-center gap-2 opacity-40">
                                <div className="text-4xl">📦</div>
                                <div className="font-medium">
                                  ยังไม่มีรายการสินค้าในสต็อก
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Modal ย่อยสำหรับ รับเข้า (Stock In) --- */}
      {showInModal && data && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowInModal(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header Section */}
            <div className="p-6 pb-0 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                รับสินค้าเข้าสต็อก
              </h3>
              <p className="text-gray-500 dark:text-zinc-400 mt-1">
                ระบุรายละเอียดขนาดและจำนวนสินค้า
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Unit Selector - Modern Tab Style */}
              <div className="bg-gray-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl flex gap-1">
                {(["m", "cm", "mm"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setInForm((prev) => ({ ...prev, unit: u }))}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                      inForm.unit === u
                        ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-black/5"
                        : "text-gray-500 hover:text-gray-700 dark:text-zinc-500 hover:dark:text-zinc-300"
                    }`}
                  >
                    {u === "mm"
                      ? "มิลลิเมตร"
                      : u === "cm"
                        ? "เซนติเมตร"
                        : "เมตร"}{" "}
                    ({u})
                  </button>
                ))}
              </div>

              {/* Dimensions Grid - Responsive row/column */}
              <div
                className={`grid gap-4 ${data.shape === "square" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}
              >
                {/* Thickness */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-600 dark:text-zinc-400 ml-1">
                    {data.shape === "square" ? "ความหนา" : "กลม"} ({inForm.unit}
                    ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={inForm.thickness}
                    onChange={(e) =>
                      setInForm((prev) => ({
                        ...prev,
                        thickness: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>

                {/* Width (Only for square) */}
                {data.shape === "square" && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-gray-600 dark:text-zinc-400 ml-1">
                      ความกว้าง ({inForm.unit}){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={inForm.width}
                      onChange={(e) =>
                        setInForm((prev) => ({
                          ...prev,
                          width: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all font-medium"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Length */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-gray-600 dark:text-zinc-400 ml-1">
                    ความยาว ({inForm.unit}){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={inForm.length}
                    onChange={(e) =>
                      setInForm((prev) => ({ ...prev, length: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 outline-none transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Quantity Selector - Enhanced UX */}
              <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 text-center">
                  จำนวนสินค้าที่รับเข้า (ชิ้น/เส้น)
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() =>
                      setInForm((p) => ({
                        ...p,
                        quantity: Math.max(1, p.quantity - 1),
                      }))
                    }
                    className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm hover:bg-emerald-50 transition-colors text-emerald-600"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={inForm.quantity}
                    onChange={(e) =>
                      setInForm((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-24 text-center bg-transparent text-2xl font-black text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button
                    onClick={() =>
                      setInForm((p) => ({ ...p, quantity: p.quantity + 1 }))
                    }
                    className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-2xl shadow-sm hover:bg-emerald-50 transition-colors text-emerald-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowInModal(false)}
                  disabled={submittingIn}
                  className="flex-1 px-6 py-3.5 rounded-2xl text-gray-500 dark:text-zinc-400 font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all order-2 sm:order-1"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleStockIn}
                  disabled={submittingIn}
                  className="flex-[2] px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] order-1 sm:order-2"
                >
                  {submittingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "ยืนยันบันทึกสต็อก"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal ย่อยสำหรับเบิกของ (Pick Modal) --- */}
      {pickingStock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop with Glassmorphism */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closePickModal}
          />

          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-7 w-full max-w-md border border-white/20 animate-in fade-in zoom-in duration-300">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <PackageMinus className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                เบิกสินค้าออกจากสต็อก
              </h3>

              {/* Info Card inside Modal */}
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                <div className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  ขนาดสินค้า ({displayUnit})
                </div>
                <div className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                  {data?.shape === "square" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      {formatValue(pickingStock.thickness)}
                      <span className="text-gray-400 font-light">×</span>
                      {formatValue(pickingStock.width)}
                      <span className="text-gray-400 font-light">×</span>
                      {formatValue(pickingStock.length)}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="text-gray-400">Ø</span>
                      {formatValue(pickingStock.thickness)}
                      <span className="text-gray-400 font-light">×</span>
                      {formatValue(pickingStock.length)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Inventory Status */}
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                  คงเหลือในคลังทั้งหมด
                </span>
                <span className="text-sm font-black px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  {pickingStock.quantity.toLocaleString()} ชิ้น
                </span>
              </div>

              {/* Quantity Input Group */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 ml-1">
                  จำนวนที่ต้องการเบิก
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPickQty(Math.max(1, pickQty - 1))}
                    className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-zinc-700 flex items-center justify-center text-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    −
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={pickingStock.quantity}
                      value={pickQty}
                      onChange={(e) =>
                        setPickQty(
                          Math.min(
                            pickingStock.quantity,
                            Math.max(0, Number(e.target.value)),
                          ),
                        )
                      }
                      className="w-full px-4 py-3 text-center text-2xl font-black rounded-2xl border-2 border-amber-500/20 dark:border-amber-500/10 bg-white dark:bg-zinc-950 focus:border-amber-500 outline-none transition-all text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setPickQty(Math.min(pickingStock.quantity, pickQty + 1))
                    }
                    className="w-12 h-12 rounded-xl border-2 border-gray-100 dark:border-zinc-700 flex items-center justify-center text-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </button>
                </div>
                {pickQty >= pickingStock.quantity && pickQty > 0 && (
                  <p className="text-[11px] text-center text-amber-600 font-medium">
                    ⚠️ คุณกำลังเบิกสินค้าจนหมดล็อทนี้
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                  onClick={closePickModal}
                  disabled={processingPick}
                  className="px-6 py-3.5 rounded-2xl text-gray-500 dark:text-zinc-400 font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmPick}
                  disabled={
                    processingPick ||
                    pickQty > pickingStock.quantity ||
                    pickQty <= 0
                  }
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale disabled:scale-100 active:scale-95"
                >
                  {processingPick ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "ยืนยันการเบิก"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
