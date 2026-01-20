"use client";

import * as React from "react";
import {
  X,
  Save,
  Building2,
  Phone,
  FileText,
  User,
  MapPin,
  Mail,
  Hash,
} from "lucide-react";
import { z } from "zod";
import { toast } from "react-toastify";

// --- Types & Schema (คงเดิม) ---
type CustomerPayload = {
  code: string;
  name: string;
  address: string;
  tel: string;
  email: string;
  taxNumber: string;
  faxNumber: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const initialForm: CustomerPayload = {
  code: "",
  name: "",
  address: "",
  tel: "",
  email: "",
  taxNumber: "",
  faxNumber: "",
};

const digitsOnly = (s: string) => s.replace(/\D/g, "");

const CustomerFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัสลูกค้า")
    .max(50, "รหัสลูกค้ายาวเกินไป"),
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

type FieldErrors = Partial<Record<keyof CustomerPayload, string>>;

// --- Component ---
export default function AddCustomerModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = React.useState<CustomerPayload>(initialForm);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [errorTop, setErrorTop] = React.useState<string | null>(null);
  const [isVisible, setIsVisible] = React.useState(false); // For animation

  // Animation logic
  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      setErrorTop(null);
      setFieldErrors({});
      // Focus logic remains
      const t = setTimeout(() => {
        document.getElementById("customer-code")?.focus();
      }, 100);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setIsVisible(false), 200); // Wait for animation
      return () => clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const setField =
    (key: keyof CustomerPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((p) => ({ ...p, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

  const validateAll = () => {
    setErrorTop(null);
    setFieldErrors({});
    const parsed = CustomerFormSchema.safeParse(form);
    if (parsed.success) return { ok: true as const, value: parsed.data };

    const nextErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path?.[0] as keyof CustomerPayload | undefined;
      if (key && !nextErrors[key]) nextErrors[key] = issue.message;
    }
    setFieldErrors(nextErrors);
    setErrorTop("กรุณาตรวจสอบข้อมูลที่กรอกให้ถูกต้อง");
    return { ok: false as const };
  };

  const submit = async () => {
    const v = validateAll();
    if (!v.ok) return;

    setSubmitting(true);
    setErrorTop(null);

    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v.value),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error("สร้างลูกค้าไม่สำเร็จ", { position: "bottom-right" });
        const msg =
          json?.error ||
          json?.message ||
          `สร้างลูกค้าไม่สำเร็จ (HTTP ${res.status})`;
        throw new Error(msg);
      }

      toast.success("เพิ่มลูกค้าสำเร็จ", { position: "bottom-right" });

      setForm(initialForm);
      setFieldErrors({});
      onClose();
      onCreated?.();
    } catch (e: any) {
      setErrorTop(e?.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open && !isVisible) return null;

  return (
    <div
      className={`h-full w-full fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity "
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`
        relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
        transition-all duration-300 transform
        ${open ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
      `}
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                เพิ่มข้อมูลลูกค้า
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                กรอกรายละเอียดเพื่อสร้างบัญชีลูกค้าใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* --- Scrollable Body --- */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Top Error Alert */}
          {errorTop && (
            <div className="flex items-start gap-3 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 animate-pulse">
              <div className="mt-0.5">
                <X size={16} />
              </div>
              <div>{errorTop}</div>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Section 1: ข้อมูลหลัก */}
            <div className="col-span-full pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ข้อมูลทั่วไป
              </span>
            </div>

            <InputField
              id="customer-code"
              label="รหัสลูกค้า"
              value={form.code}
              onChange={setField("code")}
              placeholder="เช่น C-001"
              error={fieldErrors.code}
              icon={<Hash size={16} />}
              required
            />

            <InputField
              label="ชื่อบริษัท / ชื่อลูกค้า"
              value={form.name}
              onChange={setField("name")}
              placeholder="ชื่อเต็มของลูกค้า"
              error={fieldErrors.name}
              icon={<Building2 size={16} />}
              required
            />

            <InputField
              label="เลขผู้เสียภาษี (Tax ID)"
              value={form.taxNumber}
              onChange={setField("taxNumber")}
              placeholder="ตัวเลข 13 หลัก"
              error={fieldErrors.taxNumber}
              inputMode="numeric"
              icon={<FileText size={16} />}
              required
            />

            <InputField
              label="เลขแฟกซ์ (Fax ID)"
              value={form.faxNumber}
              onChange={setField("faxNumber")}
              placeholder="7-13 หลัก"
              error={fieldErrors.faxNumber}
              inputMode="numeric"
              icon={<FileText size={16} />}
              required
            />

            {/* Section 2: การติดต่อ */}
            <div className="col-span-full pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2 mt-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                ข้อมูลการติดต่อ
              </span>
            </div>

            <InputField
              label="อีเมล"
              value={form.email}
              onChange={setField("email")}
              placeholder="example@company.com"
              error={fieldErrors.email}
              type="email"
              icon={<Mail size={16} />}
              required
            />

            <InputField
              label="เบอร์โทรศัพท์"
              value={form.tel}
              onChange={setField("tel")}
              placeholder="08X-XXX-XXXX"
              error={fieldErrors.tel}
              inputMode="numeric"
              icon={<Phone size={16} />}
              required
            />

            {/* Address (Full Width) */}
            <div className="col-span-full">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ที่อยู่สำหรับออกใบกำกับภาษี{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 text-zinc-400 pointer-events-none">
                  <MapPin size={18} />
                </div>
                <textarea
                  value={form.address}
                  onChange={setField("address")}
                  rows={3}
                  className={`
                     w-full rounded-lg border bg-white pl-10 pr-3 py-2.5 text-sm outline-none transition-all resize-none
                     dark:bg-zinc-950 dark:text-zinc-200
                     ${
                       fieldErrors.address
                         ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-900/30"
                         : "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-zinc-700 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
                     }
                   `}
                  placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                />
              </div>
              {fieldErrors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* --- Footer (Sticky Bottom) --- */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 transition-all disabled:opacity-50 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            ยกเลิก
          </button>

          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>บันทึกข้อมูล</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-component: Input Field เพื่อความสะอาดของโค้ด ---
type InputFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  id?: string;
};

function InputField({
  label,
  value,
  onChange,
  error,
  icon,
  placeholder,
  type = "text",
  inputMode,
  required,
  id,
}: InputFieldProps) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-blue-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          className={`
            w-full rounded-lg border h-10 bg-white text-sm outline-none transition-all placeholder:text-zinc-400
            dark:bg-zinc-950 dark:text-zinc-200
            ${icon ? "pl-10 pr-3" : "px-3"}
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-800 dark:focus:ring-red-900/30"
                : "border-zinc-200 hover:border-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-zinc-700 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
            }
          `}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
