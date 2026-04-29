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
  CreditCard,
  Plus,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { CustomerSchema } from "@/lib/schemas/customer.schema";
import { ContactType } from "@prisma/client";

// --- Types ---
type CustomerContact = {
  id: number;
  customerId: number;
  type: ContactType;
  value: string;
  label: string | null;
  isPrimary: boolean;
};

type Customer = {
  id: number;
  name: string;
  address: string;
  credit: number;
  tel: string | null;
  email: string | null;
  taxNumber: string | null;
  faxNumber: string | null;
  createdAt: string;
  updatedAt: string;
  contacts: CustomerContact[];
};

// contact ที่อยู่ใน form (อาจยังไม่มี id ถ้าสร้างใหม่)
type ContactDraft = {
  _key: string; // unique key สำหรับ React list
  id: number | null;
  type: ContactType;
  value: string;
  label: string;
  isPrimary: boolean;
};

type Props = {
  open: boolean;
  customerId: number | null;
  onClose: () => void;
  onUpdated?: () => void;
};

// --- Helpers ---
const CONTACT_TYPE_CONFIG: Record<
  ContactType,
  { label: string; icon: React.ReactNode; placeholder: string; color: string }
> = {
  PHONE: {
    label: "โทรศัพท์",
    icon: <Phone size={13} />,
    placeholder: "08x-xxx-xxxx",
    color:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  EMAIL: {
    label: "อีเมล",
    icon: <Mail size={13} />,
    placeholder: "example@domain.com",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
  },
  FAX: {
    label: "แฟกซ์",
    icon: <Phone size={13} />,
    placeholder: "02-xxx-xxxx",
    color:
      "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400",
  },
  ADDRESS: {
    label: "ที่อยู่สาขา",
    icon: <MapPin size={13} />,
    placeholder: "ที่อยู่...",
    color:
      "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

let _keyCounter = 0;
const newKey = () => `draft_${++_keyCounter}`;

const contactsToDrafts = (contacts: CustomerContact[]): ContactDraft[] =>
  contacts.map((c) => ({
    _key: newKey(),
    id: c.id,
    type: c.type,
    value: c.value,
    label: c.label ?? "",
    isPrimary: c.isPrimary,
  }));

// --- Sub-Components ---
type FieldRowProps = {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (val: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
};

const FieldRow = ({
  label,
  value,
  isEditing,
  onChange,
  icon,
  placeholder,
  multiline = false,
  required = false,
}: FieldRowProps) => (
  <div className="group">
    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
      {icon && <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>}
      {label}
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
          type="text"
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
          <span className="text-zinc-400 italic font-normal">- ไม่ระบุ -</span>
        )}
      </div>
    )}
  </div>
);

// --- Contact Row (Edit Mode) ---
type ContactRowProps = {
  draft: ContactDraft;
  canDelete: boolean; // false เมื่อเป็น ADDRESS ตัวสุดท้าย
  onChange: (key: string, field: keyof ContactDraft, value: unknown) => void;
  onSetPrimary: (key: string) => void;
  onDelete: (key: string) => void;
};

const ContactRow = ({
  draft,
  canDelete,
  onChange,
  onSetPrimary,
  onDelete,
}: ContactRowProps) => {
  const config = CONTACT_TYPE_CONFIG[draft.type];
  const isAddress = draft.type === "ADDRESS";

  return (
    <div
      className={`relative flex flex-col gap-2 p-3 rounded-xl border transition-all ${draft.isPrimary ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50"}`}
    >
      {/* Type Badge (fixed, no select) + Primary + Delete */}
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}
        >
          {config.icon} {config.label}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {/* Primary toggle — ทุก type รวม ADDRESS */}
          <button
            type="button"
            onClick={() => onSetPrimary(draft._key)}
            title={draft.isPrimary ? "กำลังใช้เป็นหลัก" : "ตั้งเป็นหลัก"}
            className={`p-1.5 rounded-lg transition-all ${draft.isPrimary ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30" : "text-zinc-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
          >
            {draft.isPrimary ? (
              <Star size={14} fill="currentColor" />
            ) : (
              <StarOff size={14} />
            )}
          </button>

          {/* Delete — disable เมื่อเป็น ADDRESS ตัวสุดท้าย */}
          <button
            type="button"
            onClick={() => canDelete && onDelete(draft._key)}
            disabled={!canDelete}
            title={!canDelete ? "ต้องมีที่อยู่อย่างน้อย 1 รายการ" : "ลบ"}
            className={`p-1.5 rounded-lg transition-all ${canDelete ? "text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Value + Label */}
      <div className={`flex gap-2 ${isAddress ? "flex-col" : ""}`}>
        {isAddress ? (
          <textarea
            value={draft.value}
            onChange={(e) => onChange(draft._key, "value", e.target.value)}
            placeholder={config.placeholder}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        ) : (
          <input
            type="text"
            value={draft.value}
            onChange={(e) => onChange(draft._key, "value", e.target.value)}
            placeholder={config.placeholder}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )}
        <input
          type="text"
          value={draft.label}
          onChange={(e) => onChange(draft._key, "label", e.target.value)}
          placeholder={
            isAddress
              ? "ชื่อสาขา / ที่อยู่นี้คือ..."
              : "ระบุ (เช่น คุณสมชาย, สาขา)"
          }
          className={`px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isAddress ? "w-full" : "flex-1"}`}
        />
      </div>

      {draft.isPrimary && (
        <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
          <Star size={10} fill="currentColor" />
          {isAddress
            ? "ที่อยู่นี้จะ sync เป็นที่อยู่หลักของลูกค้า"
            : "ค่านี้จะ sync เป็นข้อมูลหลักของลูกค้า"}
        </p>
      )}
    </div>
  );
};

// --- Contact View Row ---
const ContactViewRow = ({ contact }: { contact: CustomerContact }) => {
  const config = CONTACT_TYPE_CONFIG[contact.type];
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${contact.isPrimary ? "border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30"}`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs ${config.color}`}
      >
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
          {contact.value}
        </p>
        {contact.label && (
          <p className="text-xs text-zinc-400 truncate">{contact.label}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}
        >
          {config.label}
        </span>
        {contact.isPrimary && (
          <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
            <Star size={10} fill="currentColor" /> หลัก
          </span>
        )}
      </div>
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
    name: "",
    address: "",
    taxNumber: "",
    credit: 0,
  });

  // contacts state
  const [contactDrafts, setContactDrafts] = useState<ContactDraft[]>([]);
  const [deletedContactIds, setDeletedContactIds] = useState<number[]>([]);

  const isReady = open && typeof customerId === "number";

  // dirty check
  const dirty = useMemo(() => {
    if (!customer) return false;
    const formDirty =
      form.name !== (customer.name ?? "") ||
      form.address !== (customer.address ?? "") ||
      form.taxNumber !== (customer.taxNumber ?? "") ||
      form.credit !== (customer.credit ?? 0);

    const contactsDirty =
      deletedContactIds.length > 0 ||
      contactDrafts.some((d) => {
        if (!d.id) return true; // ใหม่
        const orig = customer.contacts.find((c) => c.id === d.id);
        if (!orig) return true;
        return (
          orig.type !== d.type ||
          orig.value !== d.value ||
          orig.label !== (d.label || null) ||
          orig.isPrimary !== d.isPrimary
        );
      });

    return formDirty || contactsDirty;
  }, [customer, form, contactDrafts, deletedContactIds]);

  const resetForm = (c: Customer) => {
    setForm({
      name: c.name ?? "",
      address: c.address ?? "",
      taxNumber: c.taxNumber ?? "",
      credit: c.credit ?? 0,
    });
    setContactDrafts(contactsToDrafts(c.contacts));
    setDeletedContactIds([]);
  };

  const loadCustomer = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/${id}`, {
        method: "GET",
        cache: "no-store",
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body)
        throw new Error(body?.error || "โหลดข้อมูลไม่สำเร็จ");
      setCustomer(body);
      resetForm(body);
      setMode("view");
    } catch (e: any) {
      toast.error(e.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล", {
        position: "bottom-right",
      });
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) loadCustomer(customerId!);
  }, [isReady, customerId]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setCustomer(null);
        setMode("view");
        setLoading(false);
        setSaving(false);
        setContactDrafts([]);
        setDeletedContactIds([]);
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

  // --- Contact handlers ---
  const handleContactChange = (
    key: string,
    field: keyof ContactDraft,
    value: unknown,
  ) => {
    setContactDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)),
    );
  };

  const handleSetPrimary = (key: string) => {
    setContactDrafts((prev) => {
      const target = prev.find((d) => d._key === key);
      if (!target) return prev;
      // toggle: ถ้าเป็น primary อยู่แล้วให้ unset, ถ้าไม่ใช่ให้ set และ unset ตัวอื่นใน type เดียวกัน
      if (target.isPrimary) {
        return prev.map((d) =>
          d._key === key ? { ...d, isPrimary: false } : d,
        );
      }
      return prev.map((d) =>
        d.type === target.type ? { ...d, isPrimary: d._key === key } : d,
      );
    });
  };

  const handleDeleteContact = (key: string) => {
    setContactDrafts((prev) => {
      const target = prev.find((d) => d._key === key);
      if (!target) return prev;
      // ถ้ามี id จริง → เพิ่มเข้า deletedContactIds
      if (target.id) {
        setDeletedContactIds((ids) => [...ids, target.id!]);
      }
      return prev.filter((d) => d._key !== key);
    });
  };

  const handleAddContact = (type: ContactType) => {
    setContactDrafts((prev) => [
      ...prev,
      {
        _key: newKey(),
        id: null,
        type,
        value: "",
        label: "",
        isPrimary: false,
      },
    ]);
  };

  // --- Save ---
  const handleSave = async () => {
    if (!customerId || saving) return;

    const parsed = CustomerSchema.partial().safeParse({
      ...form,
      contacts: contactDrafts.map((d) => ({
        id: d.id,
        type: d.type,
        value: d.value,
        label: d.label || null,
        isPrimary: d.isPrimary,
      })),
      deletedContactIds,
    });

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
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "บันทึกไม่สำเร็จ");

      toast.success("บันทึกข้อมูลสำเร็จ", { position: "bottom-right" });
      setCustomer(body);
      resetForm(body);
      setMode("view");
      onUpdated?.();
    } catch (e: any) {
      toast.error(e.message, { position: "bottom-right" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Group contacts by type for view mode
  const groupedContacts = customer?.contacts.reduce(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = [];
      acc[c.type].push(c);
      return acc;
    },
    {} as Record<ContactType, CustomerContact[]>,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200 ${loading ? "min-h-[300px]" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl transition-colors ${mode === "edit" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
            >
              <User size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                ข้อมูลลูกค้า
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ID: {customer?.id || "..."} •{" "}
                {mode === "view" ? "รายละเอียด" : "กำลังแก้ไขข้อมูล"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all dark:hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-16">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : !customer ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400 py-16">
              <span className="text-lg">ไม่พบข้อมูล</span>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Section 1: ข้อมูลทั่วไป */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" /> ข้อมูลทั่วไป
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FieldRow
                    label="รหัสลูกค้า"
                    value={customer.id.toString()}
                    isEditing={false}
                    icon={<Hash size={14} />}
                  />
                  <FieldRow
                    label="ชื่อลูกค้า / บริษัท"
                    required
                    value={mode === "view" ? customer.name : form.name}
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                    icon={<User size={14} />}
                  />
                  <FieldRow
                    label="เลขผู้เสียภาษี"
                    value={
                      mode === "view"
                        ? (customer.taxNumber ?? "")
                        : form.taxNumber
                    }
                    isEditing={mode === "edit"}
                    onChange={(v) => setForm((p) => ({ ...p, taxNumber: v }))}
                    icon={<FileText size={14} />}
                  />
                  <FieldRow
                    label="เครดิต (วัน)"
                    value={
                      mode === "view"
                        ? customer.credit.toString()
                        : form.credit.toString()
                    }
                    isEditing={mode === "edit"}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, credit: parseFloat(v) || 0 }))
                    }
                    icon={<CreditCard size={14} />}
                  />
                </div>
                {/* <FieldRow
                  label="ที่อยู่"
                  required
                  multiline
                  value={mode === "view" ? customer.address : form.address}
                  isEditing={mode === "edit"}
                  onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                  icon={<MapPin size={14} />}
                /> */}
              </div>

              {/* Section 2: ช่องทางติดต่อ */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Phone size={16} className="text-blue-500" /> ช่องทางติดต่อ
                  {mode === "view" && customer.contacts.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-zinc-400">
                      {customer.contacts.length} รายการ
                    </span>
                  )}
                </h3>

                {/* VIEW MODE */}
                {mode === "view" && (
                  <>
                    {customer.contacts.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic py-2">
                        - ยังไม่มีข้อมูลการติดต่อ -
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(
                          ["PHONE", "EMAIL", "FAX", "ADDRESS"] as ContactType[]
                        ).map((type) => {
                          const list = groupedContacts?.[type];
                          if (!list?.length) return null;
                          const config = CONTACT_TYPE_CONFIG[type];
                          return (
                            <div key={type} className="space-y-1.5">
                              <p
                                className={`text-xs font-semibold flex items-center gap-1 ${config.color} w-fit px-2 py-0.5 rounded-full`}
                              >
                                {config.icon} {config.label}
                              </p>
                              {list.map((c) => (
                                <ContactViewRow key={c.id} contact={c} />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* EDIT MODE */}
                {mode === "edit" && (
                  <div className="space-y-3">
                    {contactDrafts.length === 0 && (
                      <p className="text-sm text-zinc-400 italic py-1">
                        - ยังไม่มีข้อมูลการติดต่อ กดเพิ่มด้านล่าง -
                      </p>
                    )}
                    {contactDrafts.map((draft) => {
                      const addressCount = contactDrafts.filter(
                        (d) => d.type === "ADDRESS",
                      ).length;
                      const canDelete =
                        draft.type !== "ADDRESS" || addressCount > 1;
                      return (
                        <ContactRow
                          key={draft._key}
                          draft={draft}
                          canDelete={canDelete}
                          onChange={handleContactChange}
                          onSetPrimary={handleSetPrimary}
                          onDelete={handleDeleteContact}
                        />
                      );
                    })}

                    {/* Add buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(
                        ["PHONE", "EMAIL", "FAX", "ADDRESS"] as ContactType[]
                      ).map((type) => {
                        const config = CONTACT_TYPE_CONFIG[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleAddContact(type)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed transition-all hover:border-solid font-medium ${config.color} border-current opacity-70 hover:opacity-100`}
                          >
                            <Plus size={12} /> {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="text-sm text-amber-600 font-medium">
            {mode === "edit" && dirty && "⚠️ มีการแก้ไขที่ยังไม่ได้บันทึก"}
          </div>
          <div className="flex gap-3">
            {mode === "view" ? (
              <button
                onClick={() => setMode("edit")}
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
                    resetForm(customer!);
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
