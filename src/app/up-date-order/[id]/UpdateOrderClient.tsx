"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  UploadCloud,
  FileText,
  X,
  Trash2,
  CircleDashed,
  Scissors,
  Scale,
  CheckCircle2,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import DetailCustomer from "@/components/up-date-order/detailCustomer";
import { HeaderSection } from "@/components/newJobOrder/HeaderSection";
import { ItemsSection } from "@/components/newJobOrder/ItemsSection";
import Summary from "@/components/up-date-order/summary";
import Stepper from "@/components/up-date-order/stepper";
import { LoadingScreen } from "@/components/Loading";
import { toast } from "react-toastify";

import { CuttingMethod, ShapeSteel, status } from "@/types";
import {
  ApiJobOrder,
  ApiOrder,
  SteelType,
  HeadOrderType,
  SteelItem,
} from "@/types/order.types";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";

const STATUS_ORDER: Record<status, number> = {
  pending: 0,
  cutting: 1,
  weighing: 2,
  ready: 3,
  shipped: 4,
  completed: 5,
  canceled: 6,
};

const isAtLeast = (s: status, atLeast: status) =>
  STATUS_ORDER[s] >= STATUS_ORDER[atLeast];

const toInputDate = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") {
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m?.[1]) return m[1];
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

const ORDER_STATUSES = [
  "รอตัด",
  "กำลังตัด",
  "ชั่งน้ำหนัก",
  "ตัดเสร็จสิ้น",
  "กำลังส่ง",
  "เสร็จสิ้น",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  รอตัด: <CircleDashed className="h-5 w-5" />,
  กำลังตัด: <Scissors className="h-5 w-5" />,
  ชั่งน้ำหนัก: <Scale className="h-5 w-5" />,
  ตัดเสร็จสิ้น: <CheckCircle2 className="h-5 w-5" />,
  กำลังส่ง: <Truck className="h-5 w-5" />,
  เสร็จสิ้น: <PackageCheck className="h-5 w-5" />,
};

type SteelTypeApiItem = {
  id: number;
  codeSteel: string;
  shape: ShapeSteel;
  price: number;
  density?: number | null;
  requiresDimensions?: boolean | null;
  requiresAmount?: boolean | null;
};

const DEFAULT_DENSITY = 0.0000079;

// ✅ map ไทย <-> อังกฤษ
const toThaiStatus = (s: ApiOrder["status"]): OrderStatus => {
  switch (s) {
    case "pending":
      return "รอตัด";
    case "cutting":
      return "กำลังตัด";
    case "weighing":
      return "ชั่งน้ำหนัก";
    case "ready":
      return "ตัดเสร็จสิ้น";
    case "shipped":
      return "กำลังส่ง";
    case "completed":
      return "เสร็จสิ้น";
    default:
      return "รอตัด";
  }
};

type PatchPayload = {
  status?: status;
  customerId?: string;
  credit?: number;
  poNumber?: string;
  deliveryDate?: string;
  createdAt?: string;
  steel?: {
    steelType: string;
    SteelId: number;
    shape: ShapeSteel;
    sequence: number;
    wide?: number | null;
    length: number;
    thickness: number;
    amount: number;
    detail?: string | null;
    cuttingMethod?: CuttingMethod;
    job?: string | null;
    weight?: number | null;
    discount?: number | null;
    price?: number;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }[];
};

function buildPatchPayload(job: ApiOrder): PatchPayload {
  return {
    status: job.status,
    customerId: String(job.customerId),
    credit: job.credit,
    poNumber: job.poNumber ?? "",
    deliveryDate: job.deliveryDate || undefined,
    createdAt: job.createdAt || undefined,
    steel: job.steel.map((l) => ({
      steelType: l.steelType,
      SteelId: l.SteelId,
      shape: l.shape,
      sequence: l.sequence,
      amount: Number(l.amount),
      wide: l.wide ?? null,
      length: Number(l.length),
      thickness: Number(l.thickness),
      weight: l.weight ?? null,
      detail: l.detail ?? null,
      job: l.job ?? null,
      cuttingMethod: l.cuttingMethod ?? "normal",
      discount: l.discount ?? null,
      price: l.price ?? 1,
      isOD: l.isOD,
      isServices: l.isServices,
      isPerAmount: l.isPerAmount,
    })),
  };
}

const ALL_KEY = "";
const UpdateOrderPage = ({ id }: { id: string }) => {
  const router = useRouter();

  // ใช้ ApiOrder ที่ตรงกับ API จริงเลย
  const [job, setJob] = useState<ApiOrder | null>(null);
  const jobRef = React.useRef<ApiOrder | null>(null);

  // สำหรับเก็บ options ของ Select ประเภทเหล็ก
  const [steelOptions, setSteelOptions] = useState<SteelType[]>([]);
  const [steelQuery, setSteelQuery] = useState("");

  // สถานะการโหลดและบันทึก
  const [loading, setLoading] = useState(true);
  const [loadingSteel, setLoadingSteel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [useJob, setUseJob] = useState(false);

  const [poFiles, setPoFiles] = useState<File[]>([]);
  const [uploadingPoFiles, setUploadingPoFiles] = useState(false);
  const [deletingPoKey, setDeletingPoKey] = useState<string | null>(null);

  const confirm = useConfirm();

  // sync ref ให้ fetchSteel มองเห็น job ล่าสุดเสมอ
  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const hasAnyJob = (job?.steel ?? []).some((s) => s.job != null);
  useEffect(() => {
    if (hasAnyJob) setUseJob(true);
  }, [hasAnyJob]);

  const handlePoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const fileList = Array.from(event.target.files);
    setPoFiles((prev) => [...prev, ...fileList]);
    event.target.value = "";
  };

  const removeQueuedPoFile = (index: number) => {
    setPoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAndAttachPoFiles = async () => {
    if (!job) return;
    if (poFiles.length === 0) return;

    setUploadingPoFiles(true);
    try {
      const form = new FormData();
      form.append("poNumber", job.poNumber ?? "");
      form.append("customerId", String(job.customerId ?? ""));
      poFiles.forEach((f) => form.append("files", f));

      const uploadRes = await fetch("/api/upload/po/uploadPo", {
        method: "POST",
        body: form,
      });
      const uploadData: { error?: string; keys?: string[] } = await uploadRes
        .json()
        .catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(
          uploadData?.error || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PO",
        );
      }

      const newKeys = Array.isArray(uploadData.keys) ? uploadData.keys : [];
      const nextKeys = Array.from(
        new Set([...(job.urlPo ?? []), ...newKeys].map((k) => String(k))),
      );

      const patchRes = await fetch(`/api/up-date-order/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ urlPo: nextKeys }),
      });
      const patched = await patchRes.json().catch(() => null);
      if (!patchRes.ok) {
        throw new Error(patched?.error || "เกิดข้อผิดพลาดในการอัปเดต PO");
      }

      setJob(patched);
      setPoFiles([]);
      toast.success("อัปโหลดไฟล์ PO สำเร็จ", { position: "bottom-right" });
    } catch (e) {
      toast.error(
        `เกิดข้อผิดพลาด: ${
          e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PO"
        }`,
        { position: "bottom-right" },
      );
    } finally {
      setUploadingPoFiles(false);
    }
  };

  const detachAndDeletePoKey = async (key: string) => {
    if (!job) return;
    const ok = await confirm({
      title: "ยืนยันการลบไฟล์ PO",
      description:
        "คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ PO นี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
      variant: "destructive",
      confirmText: "ลบไฟล์ PO",
      cancelText: "ยกเลิก",
    });
    if (!ok) return;

    setDeletingPoKey(key);
    try {
      const deleteRes = await fetch(`/api/upload/po/deletePo/${job.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const deleteData: { error?: string } = await deleteRes
        .json()
        .catch(() => ({}));
      if (!deleteRes.ok) {
        throw new Error(deleteData?.error || "เกิดข้อผิดพลาดในการลบไฟล์ PO");
      }

      const nextKeys = (job.urlPo ?? []).filter((k) => k !== key);
      const patchRes = await fetch(`/api/up-date-order/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ urlPo: nextKeys }),
      });
      const patched = await patchRes.json().catch(() => null);
      if (!patchRes.ok) {
        throw new Error(patched?.error || "เกิดข้อผิดพลาดในการอัปเดต PO");
      }

      setJob(patched);
      toast.success("ลบไฟล์ PO สำเร็จ", { position: "bottom-right" });
    } catch (e) {
      toast.error(
        `เกิดข้อผิดพลาด: ${
          e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการลบไฟล์ PO"
        }`,
        { position: "bottom-right" },
      );
    } finally {
      setDeletingPoKey(null);
    }
  };

  const fetchSteel = async (name: string, cancelledRef?: () => boolean) => {
    setLoadingSteel(true);
    try {
      const param = new URLSearchParams();
      if (name.trim() !== "") {
        param.set("search", name.trim());
      }
      param.set("status", "active");
      const urlSteelType = `/api/steelType?${param.toString()}`;
      const res = await fetch(urlSteelType, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const data: SteelTypeApiItem[] = await res.json();
      if (cancelledRef?.()) return;
      // mapped คือการ map ข้อมูลจาก API ให้เป็น SteelType
      const mapped: SteelType[] = data.map((t) => ({
        id: String(t.id),
        steelType: t.codeSteel,
        shape: t.shape,
        price: Number(t.price ?? 0),
        density: Number(t.density ?? DEFAULT_DENSITY),
        requiresDimensions: t.requiresDimensions ?? true,
        requiresAmount: t.requiresAmount ?? true,
      }));

      setSteelOptions(mapped);
    } finally {
      if (!cancelledRef?.()) setLoadingSteel(false);
    }
  };

  // ✅ โหลด order + โหลดเหล็กทั้งหมดครั้งแรก
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/up-date-order/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch order");

        if (!cancelled) {
          setJob(data);
          jobRef.current = data; // ✅ ให้ fetchSteel รอบแรก merge ได้ทันที
        }

        await fetchSteel(ALL_KEY, () => cancelled);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to fetch job order",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validateForm = () => {
    if (!job) return "ไม่พบข้อมูลคำสั่งซื้อ";
    if (itemCount === 0) return "กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";
    if (itemCount > 15)
      return "ไม่สามารถบันทึกคำสั่งซื้อที่มีรายการเหล็กเกิน 15 รายการได้";
    if (isAtLeast(job.status, "weighing")) {
      const hasZeroPrice = job.steel.some((s) => !s.price || s.price <= 0);
      if (hasZeroPrice) return "กรุณากรอกราคาเหล็กก่อนบันทึกคำสั่งซื้อ";
    }

    for (const item of job.steel) {
      if (item.requiresAmount && (!item.amount || item.amount <= 0)) {
        return "จำนวนของเหล็กต้องมากกว่า 0";
      }
    }

    if (
      job.steel.some(
        (s) =>
          s.requiresDimensions &&
          ((s.isOD == false && !s.length) || // s.length <= 0 ||
            s.thickness == null ||
            s.thickness <= 0 ||
            (s.shape == "square" && (s.wide == null || s.wide <= 0))),
      )
    )
      return "ขนาดของเหล็กต้องมากกว่า 0";
  };

  const onSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
        position: "bottom-right",
      });
      return;
    }

    //  Guard เพื่อ TS + runtime
    if (!job) {
      toast.error("ขออภัย มีข้อผิดพลาด: ไม่พบข้อมูลคำสั่งซื้อ", {
        position: "bottom-right",
      });
      return;
    }

    const jobSnap = job; //  จากนี้ไม่ต้อง job! แล้ว
    const snapshot = jobSnap;

    setSaving(true);
    setSaveError(null);

    try {
      const jobForSend = !useJob
        ? {
            ...jobSnap,
            steel: (jobSnap.steel ?? []).map((s) => ({ ...s, job: null })),
          }
        : jobSnap;

      const payload = buildPatchPayload(jobForSend);

      const badLine = payload.steel?.find((x) => !x.SteelId);
      if (badLine) {
        toast.error(
          "ขออภัย มีข้อผิดพลาด: กรุณาเลือกประเภทเหล็กให้ครบทุกบรรทัด",
          {
            position: "bottom-right",
          },
        );
        return;
      }

      const res = await fetch(`/api/up-date-order/${jobSnap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      toast.success("บันทึกคำสั่งซื้อเรียบร้อยแล้ว", {
        position: "bottom-right",
      });
      // const mapped = toJoborder(data as ApiOrder);
      setJob(data);

      if (!useJob) {
        setJob((prev) =>
          prev
            ? {
                ...prev,
                steel: (prev.steel ?? []).map((s) => ({ ...s, job: null })),
              }
            : prev,
        );
      }
    } catch (e) {
      setJob(snapshot);
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ debounce ค้นหาเหล็ก
  useEffect(() => {
    let cancelled = false;

    const t = setTimeout(() => {
      const q = steelQuery.trim();
      fetchSteel(q.length ? q : ALL_KEY, () => cancelled);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [steelQuery]);
  if (loading) {
    return <LoadingScreen message="กำลังโหลดรายละเอียดออเดอร์..." />;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-steel/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error ไม่พบข้อมูลคำสั่งซื้อ</p>
        </div>
      </div>
    );
  }

  if (job.status === "canceled") {
    router.replace("/notFound");
    return null;
  }

  const status: OrderStatus = toThaiStatus(job.status);

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;

  // ✅ คำนวณจาก job.steel โดยตรง
  const itemCount = job.steel.length;
  const uniqueTypeCount = new Set(
    job.steel.map((i) => `${i.steelType}::${i.shape}`),
  ).size;
  const totalQty = job.steel.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0,
  );

  const fmtInt = (n: number) => Intl.NumberFormat().format(n);
  const fmtWeight = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const makeTempId = () =>
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const setSteelItems: React.Dispatch<React.SetStateAction<SteelItem[]>> = (
    next,
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      const nextSteel = typeof next === "function" ? next(prev.steel) : next;
      const withSequence = nextSteel.map((it, idx) => ({
        ...it,
        sequence: idx + 1,
      }));
      return { ...prev, steel: withSequence };
    });
  };

  const updateSteelItem = <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K],
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steel: prev.steel.map((it) =>
          it.id === id ? { ...it, [field]: value } : it,
        ),
      };
    });
  };

  const addSteelItem = () => {
    const firstSteelType = steelOptions[0];
    if (!firstSteelType) {
      toast.error("ไม่พบประเภทเหล็กในระบบ", { position: "bottom-right" });
      return;
    }
    const firstShape: ShapeSteel = firstSteelType.shape ?? "square";

    setJob((prev) => {
      if (!prev) return prev;
      const nextSequence =
        prev.steel.length > 0
          ? Math.max(...prev.steel.map((item) => item.sequence ?? 0)) + 1
          : 1;

      const steelIdNum = Number.parseInt(String(firstSteelType.id), 10);

      const newItem: SteelItem = {
        id: makeTempId(),
        SteelId: Number.isFinite(steelIdNum) ? steelIdNum : 0,
        steelType: firstSteelType.steelType ?? "",
        shape: firstShape,
        sequence: nextSequence,
        wide: firstShape === "line" ? null : 0,
        length: 0,
        thickness: 0,
        amount: 1,
        detail: "",
        cuttingMethod: "normal",
        weight: null,
        price: Number(firstSteelType.price ?? 0),
        discount: null,
        density: Number(firstSteelType.density ?? DEFAULT_DENSITY),
        isOD: false,
        isServices: false,
        isPerAmount: false,
        job: null,
        requiresDimensions: true,
        requiresAmount: true,
      };

      return {
        ...prev,
        steel: [...prev.steel, newItem].map((it, idx) => ({
          ...it,
          sequence: idx + 1,
        })),
      };
    });
  };

  const removeSteelItem = (id: SteelItem["id"]) => {
    setJob((prev) => {
      if (!prev) return prev;
      if (prev.steel.length <= 1) return prev;
      const nextSteel = prev.steel.filter((it) => it.id !== id);
      return {
        ...prev,
        steel: nextSteel.map((it, idx) => ({ ...it, sequence: idx + 1 })),
      };
    });
  };

  const headOrder: HeadOrderType = {
    poNumber: job.poNumber ?? null,
    credit: job.credit ?? 30,
    deliveryDate: toInputDate(job.deliveryDate),
    createdAt: toInputDate(job.createdAt),
  };

  const poKeys = job.urlPo ?? [];

  const setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>> = (
    next,
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      const prevHead: HeadOrderType = {
        poNumber: prev.poNumber ?? null,
        credit: prev.credit ?? 30,
        deliveryDate: toInputDate(prev.deliveryDate),
        createdAt: toInputDate(prev.createdAt),
      };
      const resolved = typeof next === "function" ? next(prevHead) : next;

      return {
        ...prev,
        poNumber: resolved.poNumber ?? null,
        credit: resolved.credit,
        deliveryDate: resolved.deliveryDate,
        createdAt:
          typeof resolved.createdAt === "string" ? resolved.createdAt : null,
      };
    });
  };

  const displayPoFileName = (key: string) => {
    const lastSeg = key.split("/").pop() || key;
    const idx = lastSeg.lastIndexOf("_");
    return idx >= 0 ? lastSeg.slice(idx + 1) : lastSeg;
  };

  return (
    <div>
      {/*Header*/}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
              disabled={saving}
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">กลับ</span>
            </Button>

            <div className="h-6 w-px bg-border/60" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm dark:bg-blue-500 dark:shadow-none">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  อัปเดตคำสั่งซื้อ
                </h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {job.poNumber || "(ไม่ระบุ PO)"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveError && (
              <span className="text-xs text-red-600 hidden sm:inline">
                {saveError}
              </span>
            )}
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ---------- สถานะ ---------- */}
        <Stepper
          status={job.status}
          setStatus={(s) => setJob((prev) => ({ ...prev!, status: s }))}
          ORDER_STATUSES={ORDER_STATUSES}
          STATUS_ICONS={STATUS_ICONS}
        />

        {/* --- Section 2: Customer Info --- */}
        <DetailCustomer
          customerId={job.customerId}
          onCustomerChange={(id) =>
            setJob((prev) => (prev ? { ...prev, customerId: id } : prev))
          }
        />

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                ไฟล์ PO
              </h2>
              <span className="ml-1 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
                {poKeys.length} ไฟล์
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer group flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/40">
                <UploadCloud className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-500" />
                <span>แนบไฟล์</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handlePoFileChange}
                  disabled={uploadingPoFiles || saving}
                />
              </label>
              <Button
                type="button"
                onClick={uploadAndAttachPoFiles}
                disabled={uploadingPoFiles || saving || poFiles.length === 0}
                className="h-10"
              >
                {uploadingPoFiles ? "กำลังอัปโหลด..." : "เพิ่มไฟล์"}
              </Button>
            </div>
          </div>

          {poFiles.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {poFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase text-zinc-400 dark:text-zinc-500">
                      {file.name.split(".").pop() || "FILE"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQueuedPoFile(index)}
                    className="absolute -right-2 -top-2 rounded-full border border-zinc-200 bg-white p-1 text-zinc-400 opacity-0 shadow-sm transition-all hover:scale-110 hover:text-red-500 group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-800"
                    aria-label="ลบไฟล์"
                    disabled={uploadingPoFiles || saving}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {poKeys.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              ยังไม่มีไฟล์ PO ในออเดอร์นี้
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {poKeys.map((key) => {
                const fileName = displayPoFileName(key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <a
                      href={`/api/upload/po/openPo/${key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      title={key}
                    >
                      {fileName}
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => detachAndDeletePoKey(key)}
                      disabled={saving || deletingPoKey === key}
                      title="ลบไฟล์"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* --- Section 3: Order Lines --- */}
        <div className="space-y-6">
          <HeaderSection headOrder={headOrder} setheadOrder={setheadOrder} />

          <ItemsSection
            steelItems={job.steel ?? []}
            setSteelItems={setSteelItems}
            updateSteelItem={updateSteelItem}
            addSteelItem={addSteelItem}
            removeSteelItem={removeSteelItem}
            steelTypes={steelOptions}
            useJob={useJob}
            setUseJob={setUseJob}
            searchItem={steelQuery}
            setsearchItem={setSteelQuery}
            loadingSteel={loadingSteel}
          />
        </div>

        {/* ---------- สรุป (อ่านจาก job.steel) ---------- */}
        <Summary job={job} fmtInt={fmtInt} fmtWeight={fmtWeight} />
      </main>
    </div>
  );
};

export default UpdateOrderPage;
