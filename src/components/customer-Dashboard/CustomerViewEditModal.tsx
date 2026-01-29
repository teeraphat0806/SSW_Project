"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Edit3,
  Save,
  Loader2,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Calendar,
  Hash,
  Building2,
} from "lucide-react";
import { toast } from "react-toastify";
import z from "zod";

// --- Types ---
type Customer = {
  id: number;
  code: string;
  name: string;
  address: string;
  tel: string;
  email: string;
  taxNumber: string;
  faxNumber: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  open: boolean;
  customerId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
};

// --- Sub-Component: Field Row (จัดการแสดงผล View/Edit ในตัวเดียว) ---
type FieldRowProps = {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  type?: string;
};

const digitsOnly = (s: string) => s.replace(/\D/g, "");

const CustomerFormSchema = z.object({
  code: z.string().trim().max(50, "รหัสลูกค้ายาวเกินไป").nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อลูกค้า")
    .max(200, "ชื่อลูกค้ายาวเกินไป"),
  address: z
    .string()
    .trim()
    .min(1, "กรุณากรอกที่อยู่")
    .min(10, "ที่อยู่สั้นเกินไป (อย่างน้อย 10 ตัวอักษร)"),
  tel: z
    .string()
    .transform((v) => digitsOnly(v))
    .refine((v) => v.length === 10, "เบอร์โทรต้องเป็นตัวเลข 10 หลัก"),
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  taxNumber: z
    .string()
    .transform((v) => digitsOnly(v))
    .refine((v) => v.length === 13, "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก"),
  faxNumber: z
    .string()
    .transform((v) => digitsOnly(v))
    .refine(
      (v) => v.length >= 7 && v.length <= 13,
      "แฟกซ์ควรเป็นตัวเลข 7–13 หลัก",
    ),
});

const FieldRow = ({
  label,
  value,
  isEditing,
  onChange,
  icon,
  placeholder,
  multiline = false,
  required = false,
  type = "text",
}: FieldRowProps) => {
  return (
    <div className="group">
      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        {icon && (
          <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
        )}
        {label}{" "}
        {required && isEditing && <span className="text-red-500">*</span>}
      </label>

      {isEditing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        )
      ) : (
        <div
          className={`text-sm text-zinc-800 dark:text-zinc-200 py-2 ${multiline ? "whitespace-pre-wrap leading-relaxed" : "font-medium"}`}
        >
          {value || (
            <span className="text-zinc-400 italic font-normal">
              - ไม่ระบุ -
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function CustomerViewEditModal({
  open,
  customerId,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    address: "",
    tel: "",
    email: "",
    taxNumber: "",
    faxNumber: "",
  });

  const isReady = open && typeof customerId === "number";

  // Check dirty state
  const dirty = useMemo(() => {
    if (!customer) return false;
    return (
      form.code !== (customer.code ?? "") ||
      form.name !== (customer.name ?? "") ||
      form.address !== (customer.address ?? "") ||
      form.tel !== (customer.tel ?? "") ||
      form.email !== (customer.email ?? "") ||
      form.taxNumber !== (customer.taxNumber ?? "") ||
      form.faxNumber !== (customer.faxNumber ?? "")
    );
  }, [customer, form]);

  // Load Data
  const loadCustomer = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${id}`, {
        method: "GET",
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);

      if (!res.ok || !body) {
        throw new Error(body?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setCustomer(body);
      setForm({
        code: body.code ?? "",
        name: body.name ?? "",
        address: body.address ?? "",
        tel: body.tel ?? "",
        email: body.email ?? "",
        taxNumber: body.taxNumber ?? "",
        faxNumber: body.faxNumber ?? "",
      });
      setMode("view");
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      setCustomer(null);
      //onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) loadCustomer(customerId!);
  }, [isReady, customerId]);

  useEffect(() => {
    if (!open) {
      // Reset when closed
      setTimeout(() => {
        setCustomer(null);
        setMode("view");
        setLoading(false);
        setSaving(false);
      }, 200);
    }
  }, [open]);

  const handleClose = () => {
    if (mode === "edit" && dirty) {
      if (!window.confirm("มีการแก้ไขที่ยังไม่บันทึก ต้องการปิดใช่หรือไม่?"))
        return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!customerId || saving) return;

    if (!form.name.trim()) {
      toast.warn("กรุณากรอกชื่อลูกค้า", { position: "bottom-right" });
      return;
    }
    const parsed = CustomerFormSchema.safeParse(form);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      toast.warn(firstError.message, { position: "bottom-right" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/customer/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "บันทึกไม่สำเร็จ");

      toast.success("บันทึกข้อมูลสำเร็จ", { position: "bottom-right" });
      setCustomer(body);
      setMode("view");
      onUpdated?.();
    } catch (e: any) {
      toast.error(e.message, { position: "bottom-right" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={`
        relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl 
        flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200
        ${loading ? "min-h-[300px]" : ""}
      `}
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${mode === "edit" ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-600"} dark:bg-zinc-800 dark:text-zinc-300 transition-colors`}
            >
              <User size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ข้อมูลลูกค้า
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                ID: {customer?.id || "..."}
                <span className="mx-1">•</span>
                {mode === "view" ? "รายละเอียด" : "กำลังแก้ไขข้อมูล"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Body (Scrollable) --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-12">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : !customer ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 py-12">
              <span className="text-lg">ไม่พบข้อมูล</span>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Section 1: Identity */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" /> ข้อมูลทั่วไป
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldRow
                    label="รหัสลูกค้า"
                    value={mode === "view" ? customer.code : form.code}
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, code: v }))}
                    icon={<Hash size={14} />}
                  />
                  <FieldRow
                    label="ชื่อลูกค้า / บริษัท"
                    value={mode === "view" ? customer.name : form.name}
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                    icon={<User size={14} />}
                    required
                  />
                  <FieldRow
                    label="เลขผู้เสียภาษี"
                    value={
                      mode === "view" ? customer.taxNumber : form.taxNumber
                    }
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, taxNumber: v }))}
                    icon={<FileText size={14} />}
                    required
                  />

                  <FieldRow
                    label="เลขแฟกซ์"
                    value={
                      mode === "view" ? customer.faxNumber : form.faxNumber
                    }
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, faxNumber: v }))}
                    icon={<Phone size={14} />}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Phone size={16} className="text-blue-500" /> การติดต่อ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldRow
                    label="เบอร์โทรศัพท์"
                    value={mode === "view" ? customer.tel : form.tel}
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, tel: v }))}
                    icon={<Phone size={14} />}
                    required
                  />
                  <FieldRow
                    label="อีเมล"
                    value={mode === "view" ? customer.email : form.email}
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                    icon={<Mail size={14} />}
                    required
                  />
                </div>
              </div>

              {/* Section 3: Address */}
              <div className="space-y-4">
                <FieldRow
                  label="ที่อยู่"
                  value={mode === "view" ? customer.address : form.address}
                  isEditing={mode === "edit"}
                  onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                  icon={<MapPin size={14} />}
                  multiline
                  required
                />
              </div>

              {/* Timestamps */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> สร้าง:{" "}
                  {new Date(customer.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Edit3 size={12} /> อัปเดต:{" "}
                  {new Date(customer.updatedAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* --- Footer --- */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="text-sm text-amber-600 font-medium">
            {mode === "edit" && dirty && "⚠️ มีการแก้ไขที่ยังไม่ได้บันทึก"}
          </div>

          <div className="flex gap-3">
            {mode === "view" ? (
              <button
                onClick={() => {
                  setMode("edit");
                }}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none transition-all"
              >
                <Edit3 size={16} /> แก้ไขข้อมูล
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMode("view");
                    setForm({
                      // Reset form
                      code: customer!.code,
                      name: customer!.name,
                      address: customer!.address,
                      tel: customer!.tel,
                      email: customer!.email,
                      taxNumber: customer!.taxNumber,
                      faxNumber: customer!.faxNumber,
                    });
                  }}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  บันทึก
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
