"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Wrench,
  ShieldCheck,
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
// --- Types ---
export type StaffMember = {
  id: number;
  name: string;
  role: "supervisor" | "cutter" | string;
};

export interface StaffInfoCardProps {
  jobOrderId: string | number;
  supervisorName?: StaffMember[];
  technicians?: StaffMember[];
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

type ModalType = "supervisor" | "cutter";

const apiRoleFromModal = (t: ModalType) =>
  t === "supervisor" ? "supervisor" : "cutter";

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

  // Local State for Immediate Updates (Optimistic UI)
  const [localSupervisors, setLocalSupervisors] = useState<StaffMember[]>([]);
  const [localTechs, setLocalTechs] = useState<StaffMember[]>([]);

  const confirm = useConfirm();

  // Sync props to local state when props change (Parent Refresh)
  useEffect(() => {
    setLocalSupervisors(uniqueStaffById(supervisorName));
  }, [supervisorName]);

  useEffect(() => {
    setLocalTechs(uniqueStaffById(technicians));
  }, [technicians]);

  // --- API Functions ---

  // 1. GET: ดึงรายชื่อพนักงานทั้งหมด (เพื่อนำมากรองและเลือกเพิ่ม)
  const fetchAvailableStaff = async (type: ModalType) => {
    setIsLoading(true);
    setAvailableStaff([]);
    setSearchTerm("");

    const role = apiRoleFromModal(type);

    try {
      const res = await fetch(
        `/api/job-order-detail/${jobOrderId}/staff?role=${role}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch staff: ${res.statusText}`);
      }

      const rawData = await res.json();

      // Map API response (nested user object) to StaffMember type
      const data: StaffMember[] = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            id: item.id,
            name: item.user?.name || item.name || "ไม่ระบุชื่อ", // ดึงชื่อจาก user.name
            role: item.user?.role || item.role || type,
          }))
        : [];

      setAvailableStaff(data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. PATCH: เพิ่มพนักงานใหม่เข้าไปใน Job Order
  const handleAddStaff = async (staffId: number) => {
    if (!modalType || isSubmitting) return;

    const role = apiRoleFromModal(modalType);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/job-order-detail/${jobOrderId}/staff`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId, role }),
      });

      if (!res.ok) {
        toast.error("ไม่สามารถเพิ่มพนักงานได้ กรุณาลองใหม่อีกครั้ง", {
          position: "bottom-right",
        });
        throw new Error(`Failed to add staff: ${res.statusText}`);
      }

      // Success: อัปเดต Local State ทันทีเพื่อให้เห็นผลเลย
      toast.success("เพิ่มพนักงานเรียบร้อยแล้ว", {
        position: "bottom-right",
      });
      const addedStaff = availableStaff.find((s) => s.id === staffId);
      if (addedStaff) {
        if (modalType === "supervisor") {
          setLocalSupervisors((prev) => [...prev, addedStaff]);
        } else {
          setLocalTechs((prev) => [...prev, addedStaff]);
        }
      }

      setIsModalOpen(false);
      onDataChange?.(); // แจ้ง Parent ให้โหลดข้อมูลใหม่ (Backup)
    } catch (error) {
      console.error("Error adding staff:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. DELETE: ลบพนักงาน
  const handleRemoveStaff = async (staffId: number, type: ModalType) => {
    const isConfirmed = await confirm({
      title: "ต้องการลบรายชื่อนี้ออกจากงานใช่หรือไม่?", // หัวข้อ
      description: "หากลบแล้วข้อมูลพนักงานจะถูกลบออกจากงานนี้ทันที", // คำอธิบาย
      variant: "destructive", // ใส่เพื่อให้ปุ่มเป็นสีแดง (optional)
      confirmText: "ลบข้อมูล", // ข้อความปุ่มยืนยัน
      cancelText: "ไม่ลบ", // ข้อความปุ่มยกเลิก
    });
    if (!isConfirmed) return;

    const role = apiRoleFromModal(type);

    try {
      const res = await fetch(`/api/job-order-detail/${jobOrderId}/staff`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, role }),
      });

      if (!res.ok) {
        toast.error("ไม่สามารถลบพนักงานได้ กรุณาลองใหม่อีกครั้ง", {
          position: "bottom-right",
        });
        throw new Error("Failed to remove staff");
      }
      toast.success("ลบพนักงานเรียบร้อยแล้ว", {
        position: "bottom-right",
      });

      // Success: ลบออกจาก Local State ทันที
      if (type === "supervisor") {
        setLocalSupervisors((prev) => prev.filter((s) => s.id !== staffId));
      } else {
        setLocalTechs((prev) => prev.filter((s) => s.id !== staffId));
      }

      onDataChange?.();
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("เกิดข้อผิดพลาดในการลบพนักงาน");
    }
  };

  // --- Handlers ---
  const openModal = (type: "supervisor" | "cutter") => {
    setModalType(type);
    setIsModalOpen(true);
    fetchAvailableStaff(type);
  };

  // Logic: กรองพนักงานที่มีอยู่แล้วใน Job Order ออกจากรายการที่จะให้เลือก
  const filteredList = availableStaff
    .filter((candidate) => {
      // ตรวจสอบกับ Local State ปัจจุบันแทน Props เพื่อความแม่นยำล่าสุด
      const currentAssignedList =
        modalType === "supervisor" ? localSupervisors : localTechs;

      // คืนค่า true เฉพาะคนที่ ID "ไม่ตรง" กับคนที่มีอยู่แล้ว (คือคนใหม่)
      return !currentAssignedList.some((curr) => curr.id === candidate.id);
    })
    .filter((s) =>
      // กรองตามคำค้นหา (Search Term)
      (s?.name ?? "").toLowerCase().includes((searchTerm ?? "").toLowerCase())
    );

  return (
    <>
      {/* --- Main Card --- */}
      <div
        className={cn(
          "overflow-hidden rounded-xl  shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800",
          className
        )}
      >
        
        {/* Header */}
        <div className="border-b bg-muted/40 px-6 py-4 dark:bg-zinc-900/80 dark:border-zinc-800">
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
                count={localSupervisors.length}
                label="หัวหน้า"
                color="blue"
              />
              <StatBadge
                count={localTechs.length}
                label="ช่าง"
                color="orange"
              />
            </div>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x md:divide-y-0 dark:divide-zinc-800">
          {/* 1. Supervisor Column */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader
                icon={<ShieldCheck className="h-4 w-4" />}
                title="หัวหน้างาน"
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => openModal("supervisor")}
                className="h-8 w-8 rounded-full border-dashed border-muted-foreground/30 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 space-y-3">
              {localSupervisors.length === 0 ? (
                <EmptyState text="ยังไม่ได้ระบุหัวหน้างาน" />
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {localSupervisors.map((staff) => (
                    <PersonItem
                      key={staff.id}
                      name={staff.name}
                      role="Supervisor"
                      avatarColor="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
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
                icon={<Wrench className="h-4 w-4" />}
                title="ช่างเทคนิค"
                colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => openModal("cutter")}
                className="h-8 w-8 rounded-full border-dashed border-muted-foreground/30 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 space-y-3">
              {localTechs.length === 0 ? (
                <EmptyState text="ยังไม่ได้ระบุช่างรับผิดชอบ" />
              ) : (
                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {localTechs.map((staff) => (
                    <PersonItem
                      key={staff.id}
                      name={staff.name}
                      role="Technician"
                      avatarColor="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      onRemove={() => handleRemoveStaff(staff.id, "cutter")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Beautiful Modal (Radix UI) --- */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 border bg-background p-0 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Modal Header */}
            <div className="flex flex-col space-y-1.5 border-b px-6 py-4 dark:border-zinc-800">
              <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-foreground">
                เพิ่ม{modalType === "supervisor" ? "หัวหน้างาน" : "ช่างเทคนิค"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                ค้นหารายชื่อพนักงานที่ต้องการมอบหมายงาน
              </Dialog.Description>
            </div>

            {/* Search Input Area */}
            <div className="px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                  className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800/50 dark:border-zinc-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Staff List Area */}
            <div className="max-h-[300px] min-h-[150px] overflow-y-auto px-2 pb-4">
              {isLoading ? (
                <div className="flex h-[150px] flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">กำลังโหลดข้อมูล...</span>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="flex h-[150px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                  <div className="p-3 rounded-full bg-muted/50 dark:bg-zinc-800">
                    <User className="h-6 w-6 opacity-50" />
                  </div>
                  <span>
                    {searchTerm
                      ? "ไม่พบรายชื่อที่ค้นหา"
                      : "ไม่มีพนักงานเพิ่มเติมให้เลือก"}
                  </span>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  <span className="text-xs font-medium text-muted-foreground px-2 mb-2 block">
                    รายชื่อพนักงานที่เลือกได้ ({filteredList.length})
                  </span>
                  {filteredList.map((staff) => (
                    <button
                      key={staff.id}
                      disabled={isSubmitting}
                      onClick={() => handleAddStaff(staff.id)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50 dark:hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20">
                          {staff.name
                            ? staff.name.slice(0, 2).toUpperCase()
                            : "??"}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm font-medium text-foreground leading-none">
                            {staff.name || "ไม่ระบุชื่อ"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {modalType === "supervisor"
                              ? "Supervisor"
                              : "Technician"}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100 bg-background dark:bg-zinc-800 dark:border-zinc-700">
                        <Plus className="h-3.5 w-3.5 text-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

/* --------------------------------- Sub-Components -------------------------------- */

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
      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
      : "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        colorStyle
      )}
    >
      <span>{label}</span>
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/50 px-1 text-[10px] font-bold shadow-sm dark:bg-black/20">
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
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
          colorClass
        )}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
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
    <div className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/30 p-2.5 transition-all hover:bg-card hover:border-border hover:shadow-sm dark:bg-zinc-800/30 dark:hover:bg-zinc-800">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm",
            avatarColor
          )}
        >
          {getInitials(name)}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {name || "Unknown"}
          </span>
          <span className="text-[11px] text-muted-foreground">{role}</span>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mr-1 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted py-8 text-center bg-muted/10 dark:bg-zinc-900/20">
      <div className="rounded-full bg-muted p-3 mb-2 dark:bg-zinc-800">
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
