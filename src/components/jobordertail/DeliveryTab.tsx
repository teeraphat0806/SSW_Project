// src/components/jobordertail/DeliveryTab.tsx
"use client";
import { useState } from "react";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Truck,
  Calendar,
  MapPin,
  Package,
  Check,
  AlertCircle,
  Box,
  Copy,
  ExternalLink,
  RotateCcw,
  Play,
  Users,
  Plus,
  Trash2,
  Search,
  Loader2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import { useConfirm } from "../providers/confirm-dialog-provider";

// Types (คงเดิม)
export type JobStatus =
  | "pending"
  | "cutting"
  | "weighing"
  | "ready"
  | "shipped"
  | "completed";

export type SteelItem = {
  steelType: string;
  amount: number;
  width?: number;
  length?: number;
  thickness?: number;
  price: number;
  weight: number;
  detail?: string;
  density: number;
  shape: string;
};

export type DeliveryStaff = {
  id: number;
  name: string;
  role: "delivery";
};

export type DeliveryTabProps = {
  jobOrderId: string | number;
  status: JobStatus;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
  assignedDelivery?: DeliveryStaff;
  items?: SteelItem[];
  onUpdateStatus: (newStatus: JobStatus) => void | Promise<void>;
  onDataChange?: () => void;
  className?: string;
};

export function DeliveryTab({
  jobOrderId,
  status,
  deliveryDate,
  deliveryAddress,
  assignedDelivery,
  items = [],
  onUpdateStatus,
  onDataChange,
  className,
}: DeliveryTabProps) {
  const [checkedState, setCheckedState] = React.useState<
    Record<number, boolean>
  >({});
  const [isAddressCopied, setIsAddressCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableDelivery, setAvailableDelivery] = useState<DeliveryStaff[]>(
    [],
  );
  const [localDelivery, setLocalDelivery] = useState<DeliveryStaff | undefined>(
    assignedDelivery,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = useConfirm();

  React.useEffect(() => {
    setLocalDelivery(assignedDelivery);
  }, [assignedDelivery]);

  // Logic Checklist
  const handleCheck = (index: number) => {
    // ยอมให้ติ๊กได้ตอน ready หรือ shipped (เผื่อคนขับรถเช็คของตอนขึ้นรถ)
    if (status !== "ready" && status !== "shipped") return;
    setCheckedState((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCheckAll = () => {
    if (status !== "ready" && status !== "shipped") return;
    const allChecked =
      items.length > 0 && items.every((_, idx) => checkedState[idx]);
    if (allChecked) {
      setCheckedState({});
    } else {
      const newState: Record<number, boolean> = {};
      items.forEach((_, idx) => (newState[idx] = true));
      setCheckedState(newState);
    }
  };

  // Logic Address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(deliveryAddress ?? "");
    setIsAddressCopied(true);
    setTimeout(() => setIsAddressCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(deliveryAddress ?? "");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank",
    );
  };

  const fetchCurrentDelivery = async () => {
    try {
      const res = await fetch(`/api/job-order-detail/${jobOrderId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setLocalDelivery(data?.deliveryStaff ?? undefined);
    } catch (error) {
      console.error("Failed to refresh delivery assignment:", error);
    }
  };

  const fetchAvailableDelivery = async () => {
    setIsLoadingStaff(true);
    setSearchTerm("");
    setAvailableDelivery([]);
    try {
      const res = await fetch(
        `/api/job-order-detail/${jobOrderId}/staff?role=delivery`,
      );
      if (!res.ok) throw new Error(`Failed to fetch staff: ${res.statusText}`);
      const rawData = await res.json();
      const mapped: DeliveryStaff[] = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            id: item.id,
            name: item.name || item.user?.name || "Unknown",
            role: "delivery" as const,
          }))
        : [];
      setAvailableDelivery(mapped);
    } catch (error) {
      console.error("Failed to fetch delivery staff:", error);
      toast.error("ไม่สามารถโหลดรายชื่อพนักงานขนส่งได้", {
        position: "bottom-right",
      });
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const openDeliveryModal = () => {
    setIsModalOpen(true);
    fetchAvailableDelivery();
  };

  const handleAssignDelivery = async (staffId: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/job-order-detail/${jobOrderId}/staff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, role: "delivery" }),
      });
      if (!res.ok) throw new Error("Failed to assign delivery");
      const selected = availableDelivery.find((s) => s.id === staffId);
      if (selected) setLocalDelivery(selected);
      setIsModalOpen(false);
      await fetchCurrentDelivery();
      toast.success("เพิ่มคนขนส่งเรียบร้อยแล้ว", { position: "bottom-right" });
    } catch (error) {
      console.error("Assign delivery failed:", error);
      toast.error("ไม่สามารถเพิ่มคนขนส่งได้", { position: "bottom-right" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDelivery = async () => {
    if (isSubmitting) return;
    // const confirmed = window.confirm("ต้องการลบคนขนส่งออกจากงานนี้ใช่หรือไม่?");
    const isconfirmed = await confirm({
      title: "ยืนยันการลบ",
      description: "ต้องการลบคนขนส่งออกจากงานนี้ใช่หรือไม่?",
      variant: "destructive",
      confirmText: "ลบคนขนส่ง",
      cancelText: "ยกเลิก",
    })
    if (!isconfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/job-order-detail/${jobOrderId}/staff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "delivery" }),
      });
      if (!res.ok) throw new Error("Failed to clear delivery assignment");
      setLocalDelivery(undefined);
      await fetchCurrentDelivery();
      toast.success("ลบคนขนส่งเรียบร้อยแล้ว", { position: "bottom-right" });
    } catch (error) {
      console.error("Remove delivery failed:", error);
      toast.error("ไม่สามารถลบคนขนส่งได้", { position: "bottom-right" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allChecked =
    items.length > 0 && items.every((_, idx) => checkedState[idx]);
  const checkedCount = Object.keys(checkedState).length;
  const filteredDelivery = availableDelivery
    .filter((s) => s.id !== localDelivery?.id)
    .filter((s) =>
      (s.name ?? "").toLowerCase().includes((searchTerm ?? "").toLowerCase()),
    );

  // Status Checks
  const isReadyStep = status === "ready";
  const isShippedStep = status === "shipped"; // สถานะปัจจุบันคือส่งของแล้ว
  const isPostReady = isShippedStep; // ใช้สำหรับล็อกสถานะเช็คของ
  const handleShipStatus = async () => {
    await onUpdateStatus("shipped");
    await fetchCurrentDelivery();
  };

  // const progressPercent =
  //   items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <div
      className={cn(
        "px-5 py-6 space-y-8 animate-in fade-in duration-500",
        className,
      )}
    >
      {/* 1. Address Section (ย้ายมาไว้บนสุดเพื่อให้เห็นที่อยู่ชัดเจนสำหรับคนจัดส่ง) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Header Banner */}
          <div
            className={cn(
              "relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between",
              isPostReady
                ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                : "bg-card dark:bg-zinc-900/50 dark:border-zinc-800",
            )}
          >
            <div className="flex items-center gap-4 z-10">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset transition-colors",
                  isPostReady
                    ? "bg-blue-100 text-blue-600 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800"
                    : "bg-amber-100 text-amber-600 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800",
                )}
              >
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {isPostReady
                    ? "สินค้าอยู่ระหว่างจัดส่ง"
                    : "เตรียมจัดส่งสินค้า"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {isPostReady
                    ? "สินค้ากำลังเดินทางไปยังลูกค้า"
                    : "ตรวจสอบรายการและยืนยันการนำส่ง"}
                </p>
              </div>
            </div>
            {deliveryDate && (
              <div className="z-10 flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  กำหนดส่ง:{" "}
                  <span className="font-medium text-foreground">
                    {deliveryDate}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <h5 className="font-semibold flex items-center gap-2 text-sm text-foreground">
                <Package className="h-4 w-4" /> รายการสินค้าขึ้นรถ
              </h5>
              <div className="text-xs text-muted-foreground">
                เช็คแล้ว {isPostReady ? items.length : checkedCount}/
                {items.length}
              </div>
            </div>

            <div className="divide-y dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  ไม่มีรายการสินค้า
                </div>
              ) : (
                items.map((item, idx) => {
                  const isChecked = checkedState[idx] || isPostReady;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleCheck(idx)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                        isChecked && "bg-blue-50/50 dark:bg-blue-900/10",
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center transition-all",
                          isChecked
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-muted-foreground/30",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3",
                            isChecked ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.steelType}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.width} x {item.length} x {item.thickness}
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {item.amount}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
            {!isPostReady && (
              <div className="border-t p-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCheckAll}
                  className="text-xs h-8"
                >
                  {allChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Address & Action */}
        <div className="space-y-6">
          {/* Address Card */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="border-b bg-muted/20 px-4 py-3">
              <h4 className="flex items-center gap-2 font-semibold text-sm">
                <MapPin className="h-4 w-4 text-red-500" /> ที่อยู่จัดส่ง
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg border border-dashed">
                {deliveryAddress || "-"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="text-xs h-8 gap-2"
                >
                  {isAddressCopied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  คัดลอก
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGoogleMaps}
                  className="text-xs h-8 gap-2"
                >
                  <ExternalLink className="h-3 w-3" /> นำทาง
                </Button>
              </div>
            </div>
          </div>

          {/* Action Button Section */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 backdrop-blur p-4 shadow-sm space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  ยืนยันการจัดส่ง
                </h5>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  ตรวจสอบรายการให้ครบ แล้วกดเพื่อเปลี่ยนสถานะเป็น กำลังจัดส่ง
                </p>
              </div>

              {/* Status badge (optional but helpful) */}
              {status === "ready" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
                  onClick={() => onUpdateStatus("weighing")}
                  title="ย้อนกลับสถานะ (Undo)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isReadyStep ? (
              <div className="space-y-3">
                {/* Warning callout when not all checked */}
                {!allChecked && (
                  <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/30 p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          ยังตรวจสอบสินค้าไม่ครบ
                        </p>
                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-0.5">
                          กรุณาติ๊กตรวจสอบให้ครบทุกบรรทัดก่อน
                          เพื่อป้องกันการส่งของผิด/ขาด
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary action */}
                <Button
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleShipStatus}
                  disabled={!allChecked}
                >
                  <Play className="h-3 w-3 fill-current" />
                  ยืนยันจัดส่งสินค้า{" "}
                </Button>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  เมื่อยืนยันแล้ว ระบบจะล็อกขั้นตอนการผลิต และไปขั้นตอนการจัดส่ง
                </p>
              </div>
            ) : isPostReady ? (
              <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
                <div className="flex items-start gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      ส่งสินค้าเรียบร้อย
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                      สามารถกด “เสร็จสิ้นงาน” ได้ที่แท็บ{" "}
                      <span className="font-medium">เสร็จสิ้น</span>
                    </p>
                  </div>
                </div>

                {status === "shipped" && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-11 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() => onUpdateStatus("ready")}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      ย้อนกลับ
                    </Button>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                      ใช้กรณีย้อนกลับสถานะ เช่น กรณีลูกค้าไม่รับของ
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  รอการผลิตเสร็จสิ้น
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  เมื่อสถานะเป็น พร้อมจัดส่ง แล้วจึงจะยืนยันการจัดส่งได้
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h5 className="font-semibold flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4" />
              คนขนส่ง
            </h5>
            <Button
              variant="outline"
              size="sm"
              onClick={openDeliveryModal}
              className="h-8 border-dashed border-muted-foreground/30"
            >
              {localDelivery ? "เปลี่ยนคนส่ง" : "+"}
            </Button>
          </div>
        </div>

        <div className="p-4">
          {!localDelivery ? (
            <p className="text-sm text-muted-foreground">ยังไม่ได้ระบุคนขนส่ง</p>
          ) : (
            <div className="group flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {localDelivery.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{localDelivery.name}</p>
                  <p className="text-xs text-muted-foreground">Delivery</p>
                </div>
              </div>
              <button
                onClick={handleRemoveDelivery}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background p-0 shadow-2xl sm:rounded-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col space-y-1.5 border-b px-6 py-4 dark:border-zinc-800">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                เพิ่มคนขนส่ง
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                เลือกรายชื่อพนักงานขนส่งเพื่อมอบหมายงาน
              </Dialog.Description>
            </div>

            <div className="px-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                  className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 pl-9 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[300px] min-h-[150px] overflow-y-auto px-2 pb-4">
              {isLoadingStaff ? (
                <div className="flex h-[150px] flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-sm">กำลังโหลดข้อมูล...</span>
                </div>
              ) : filteredDelivery.length === 0 ? (
                <div className="flex h-[150px] flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                  <div className="p-3 rounded-full bg-muted/50">
                    <User className="h-6 w-6 opacity-50" />
                  </div>
                  <span>
                    {searchTerm
                      ? "ไม่พบรายชื่อที่ค้นหา"
                      : "ไม่มีพนักงานขนส่งเพิ่มเติมให้เลือก"}
                  </span>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredDelivery.map((staff) => (
                    <button
                      key={staff.id}
                      disabled={isSubmitting}
                      onClick={() => handleAssignDelivery(staff.id)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-all hover:bg-accent disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm font-medium text-foreground leading-none">
                            {staff.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Delivery
                          </span>
                        </div>
                      </div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <Plus className="h-3.5 w-3.5 text-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}



