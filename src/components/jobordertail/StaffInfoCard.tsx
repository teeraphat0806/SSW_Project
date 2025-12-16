"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog"; // ใช้ Radix UI โดยตรง
import {
  Wrench,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils"; // ถ้าไม่มีให้ใช้ clsx หรือ template string แทน

// --- Types ---
export type StaffMember = {
  id: number;
  name: string;
  role: "supervisor" | "cutter" | string;
};

export interface StaffInfoCardProps {
  /** ID ของ Job Order เพื่อใช้ยิง API */
  jobOrderId: string | number;
  /** รายชื่อหัวหน้างาน */
  supervisorName?: StaffMember[];
  /** รายชื่อช่าง */
  technicians?: StaffMember[];
  /** Callback เมื่อมีการเปลี่ยนแปลงข้อมูล (ให้ Parent โหลดข้อมูลใหม่) */
  onDataChange?: () => void;
  className?: string;
}

// --- Helper: Unique Filter ---
function uniqueStaffById(arr?: StaffMember[]): StaffMember[] {
  if (!Array.isArray(arr)) return [];
  const map = new Map<number, StaffMember>();
  arr.forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values());
}

// --- Main Component ---
export function StaffInfoCard({
  jobOrderId,
  supervisorName,
  technicians,
  onDataChange,
  className,
}: StaffInfoCardProps) {
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"supervisor" | "cutter" | null>(
    null
  );
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter Unique Data
  const supervisors = uniqueStaffById(supervisorName);
  const techs = uniqueStaffById(technicians);

  // --- API Functions ---

  // 1. GET: ดึงรายชื่อคนงานที่สามารถเพิ่มได้
  const fetchAvailableStaff = async (type: "supervisor" | "cutter") => {
    setIsLoading(true);
    setAvailableStaff([]);
    setSearchTerm("");

    // Endpoint logic
    const endpoint = type === "cutter" ? "cutter" : "supervisors";

    try {
      const res = await fetch(
        `/api/job-order-detail/${jobOrderId}/${endpoint}`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const data: StaffMember[] = await res.json();
      setAvailableStaff(data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      alert("ไม่สามารถโหลดรายชื่อพนักงานได้");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. PATCH: เพิ่มพนักงาน
  const handleAddStaff = async (staffId: number) => {
    if (!modalType || isSubmitting) return;
    const endpoint = modalType === "cutter" ? "cutter" : "supervisors";

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/job-order-detail/${jobOrderId}/${endpoint}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId }),
        }
      );

      if (!res.ok) throw new Error("Failed to add staff");

      // Success
      setIsModalOpen(false);
      onDataChange?.(); // Refresh Parent Data
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. DELETE: ลบพนักงาน
  const handleRemoveStaff = async (
    staffId: number,
    type: "supervisor" | "cutter"
  ) => {
    if (!confirm("ต้องการลบพนักงานคนนี้ออกจากรายการใช่หรือไม่?")) return;

    const endpoint = type === "cutter" ? "cutter" : "supervisors";

    try {
      const res = await fetch(
        `/api/job-order-detail/${jobOrderId}/${endpoint}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId }),
        }
      );

      if (!res.ok) throw new Error("Failed to remove staff");

      onDataChange?.(); // Refresh Parent Data
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการลบพนักงาน");
    }
  };

  // --- Handlers ---
  const openModal = (type: "supervisor" | "cutter") => {
    setModalType(type);
    setIsModalOpen(true);
    fetchAvailableStaff(type);
  };

  // Logic: กรองคนที่มีอยู่แล้วออก + ค้นหาตามชื่อ
  const filteredList = availableStaff
    .filter((candidate) => {
      const currentList = modalType === "supervisor" ? supervisors : techs;
      return !currentList.some((curr) => curr.id === candidate.id);
    })
    .filter((s) =>
      (s?.name ?? "").toLowerCase().includes((searchTerm ?? "").toLowerCase())
    );

  return (
    <>
      {/* --- Main Card --- */}
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800",
          className
        )}
      >
        {/* Header */}
        <div className="border-b bg-slate-50/50 px-6 py-4 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                ทีมงานผู้รับผิดชอบ
              </h3>
              <p className="text-sm text-muted-foreground">
                รายชื่อบุคลากรที่ดูแลจัดการและปฏิบัติงานในออเดอร์นี้
              </p>
            </div>
            <div className="flex gap-2">
              <StatBadge
                count={supervisors.length}
                label="หัวหน้า"
                color="blue"
              />
              <StatBadge count={techs.length} label="ช่าง" color="orange" />
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x md:divide-y-0">
          {/* 1. Supervisor Column */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                icon={<ShieldCheck className="h-5 w-5" />}
                title="หัวหน้างาน"
                colorClass="bg-blue-500 text-white"
              />
              <button
                onClick={() => openModal("supervisor")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 space-y-3">
              {supervisors.length === 0 ? (
                <EmptyState text="ยังไม่ได้ระบุหัวหน้างาน" />
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {supervisors.map((staff) => (
                    <PersonItem
                      key={staff.id}
                      name={staff.name}
                      role="Supervisor"
                      avatarColor="bg-blue-500 text-white"
                      onRemove={() => handleRemoveStaff(staff.id, "supervisor")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Technician Column */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                icon={<Wrench className="h-5 w-5" />}
                title="ช่างเทคนิค"
                colorClass="bg-orange-500 text-white"
              />
              <button
                onClick={() => openModal("cutter")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 space-y-3">
              {techs.length === 0 ? (
                <EmptyState text="ยังไม่ได้ระบุช่างรับผิดชอบ" />
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {techs.map((staff) => (
                    <PersonItem
                      key={staff.id}
                      name={staff.name}
                      role="Technician"
                      avatarColor="bg-orange-500 text-white"
                      onRemove={() => handleRemoveStaff(staff.id, "cutter")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Radix UI Dialog (Modal) --- */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          {/* Overlay: พื้นหลังสีดำจางๆ */}
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          {/* Content: กล่อง Modal ตรงกลาง */}
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:bg-zinc-900">
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                เพิ่ม {modalType === "supervisor" ? "หัวหน้างาน" : "ช่างเทคนิค"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                ค้นหาและเลือกพนักงานเพื่อเพิ่มในรายการ
              </Dialog.Description>
            </div>

            {/* Body: Search & List */}
            <div className="space-y-4 py-2">
              {/* Custom Input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ..."
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 pl-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* List Area */}
              <div className="h-[250px] w-full rounded-md border border-slate-200 p-2 overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span className="text-sm">กำลังโหลดข้อมูล...</span>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {searchTerm
                      ? "ไม่พบรายชื่อที่ค้นหา"
                      : "ไม่มีรายชื่อที่สามารถเพิ่มได้"}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredList.map((staff) => (
                      <button
                        key={staff.id}
                        disabled={isSubmitting}
                        onClick={() => handleAddStaff(staff.id)}
                        className="flex w-full items-center justify-between rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                            {staff.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {staff.name}
                          </span>
                        </div>
                        <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Close Button (X) */}
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/* --------------------------------- Sub-Components (Styled with Tailwind) -------------------------------- */

const StatBadge = ({
  count,
  label,
  color,
}: {
  count: number;
  label: string;
  color: "blue" | "orange";
}) => {
  const colorStyle =
    color === "blue"
      ? "bg-blue-500 text-white border-blue-600"
      : "bg-orange-500 text-white border-orange-600";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm",
        colorStyle
      )}
    >
      <span>{label}</span>
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold">
        {count}
      </span>
    </div>
  );
};

function SectionHeader({
  icon,
  title,
  colorClass,
}: {
  icon: React.ReactNode;
  title: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm",
          colorClass
        )}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h4>
    </div>
  );
}

function PersonItem({
  name,
  role,
  avatarColor,
  onRemove,
}: {
  name: string;
  role: string;
  avatarColor: string;
  onRemove?: () => void;
}) {
  const getInitials = (n: string | null | undefined) => {
    if (!n || typeof n !== "string") return "??";
    return n
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="group flex items-center justify-between rounded-xl border border-transparent bg-slate-50/50 p-2 transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm dark:bg-zinc-800/50 dark:hover:bg-zinc-800">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
            avatarColor
          )}
        >
          {getInitials(name)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {name || "Unknown"}
          </span>
          <span className="text-[11px] text-slate-500">{role}</span>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mr-1 rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center bg-slate-50/50 dark:border-zinc-700 dark:bg-zinc-900/20">
      <div className="rounded-full bg-slate-100 p-3 mb-2 dark:bg-zinc-800">
        <Users className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 font-medium">{text}</p>
    </div>
  );
}
