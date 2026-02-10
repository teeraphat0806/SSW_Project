"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  CircleDashed,
  Scissors,
  Scale,
  CheckCircle2,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import DetailCustomer from "@/components/up-date-order/detailCustomer";
import DetailItem from "@/components/up-date-order/detailItem";
import Summary from "@/components/up-date-order/summary";
import Stepper from "@/components/up-date-order/stepper";
import { LoadingScreen } from "@/components/Loading";
import { toast } from "react-toastify";

import { CuttingMethod, ShapeSteel, status } from "@/types";

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

type ApiJobOrder = {
  id: number;
  poNumber: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string;
  customerTaxId: string;
  customerFax: string | null;
  credit: number;
  steel: {
    id: number;
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    unitPrice: number;
    shape: ShapeSteel;
    job?: number | null;
    cuttingMethod: CuttingMethod;
    density: number;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
    discount: number | null;
    price: number;
  }[];
  status: status;
};

type Joborder = {
  id: string;
  poNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string;
  customerTaxId: string;
  customerFax: string | null;
  credit: number;
  steel: {
    id: number;
    steelType: string;
    amount: number;
    width?: number | null;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    unitPrice: number;
    shape: ShapeSteel;
    density: number;
    job?: number | null;
    cuttingMethod: CuttingMethod;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
    discount: number | null;
    price: number;
  }[];
  status: status;
};

const toJoborder = (api: ApiJobOrder): Joborder => ({
  id: api.id.toString(),
  poNumber: api.poNumber ?? "",
  credit: api.credit ?? 30,
  customerId: api.customerId ?? "",
  customerName: api.customerName ?? "",
  customerEmail: api.customerEmail ?? null,
  customerPhone: api.customerPhone ?? null,
  customerAddress: api.customerAddress ?? "",
  customerTaxId: api.customerTaxId ?? "",
  customerFax: api.customerFax ?? null,
  steel: (api.steel ?? []).map((s) => ({
    id: s.id,
    steelType: s.steelType,
    amount: s.amount,
    width: s.width ?? null,
    length: s.length ?? 0,
    thickness: s.thickness ?? 0,
    detail: s.detail ?? null,
    weight: s.weight ?? null,
    unitPrice: s.unitPrice,
    shape: s.shape,
    job: s.job ?? null,
    cuttingMethod: s.cuttingMethod ?? "normal",
    isOD: s.isOD ?? false,
    isServices: s.isServices ?? false,
    isPerAmount: s.isPerAmount ?? false,
    discount: s.discount ?? null  ,
    price: s.price ?? 1,
    density: s.density ?? 0.0000079,
  })),
  status: api.status,
});

const ORDER_STATUSES = [
  "รอตัด",
  "กำลังตัด",
  "ชั่งน้ำหนัก",
  "ตัดเสร็จสิ้น",
  "กำลังส่ง",
  "ส่งสำเร็จ",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  รอตัด: <CircleDashed className="h-5 w-5" />,
  กำลังตัด: <Scissors className="h-5 w-5" />,
  ชั่งน้ำหนัก: <Scale className="h-5 w-5" />,
  ตัดเสร็จสิ้น: <CheckCircle2 className="h-5 w-5" />,
  กำลังส่ง: <Truck className="h-5 w-5" />,
  ส่งสำเร็จ: <PackageCheck className="h-5 w-5" />,
};

type SteelOption = {
  value: string;
  codeSteel: string;
  label: string;
  amount: number;
  price: number;
  shape: ShapeSteel;
};

type SteelStockApiItem = {
  id: number;
  codeSteel: string;
  price: number;
  amount: number;
  shape: ShapeSteel;
};

const steelKey = (codeSteel: string, shape: ShapeSteel) =>
  `${codeSteel}::${shape}`;

function mergeOrderSteelIntoOptions(
  options: SteelOption[],
  job: Joborder | null,
): SteelOption[] {
  if (!job?.steel?.length) return options;

  const map = new Map(options.map((o) => [steelKey(o.codeSteel, o.shape), o]));

  for (const s of job.steel) {
    const code = s.steelType?.trim();
    const shape = s.shape ?? "square";
    if (!code) continue;
    const key = steelKey(code, shape);

    // ถ้าไม่มีใน options ให้เติมเข้าไป (amount=0) เพื่อให้ Select แสดงได้
    if (!map.has(key)) {
      map.set(key, {
        value: key,
        codeSteel: code,
        label: code,
        amount: 0,
        price: 0,
        shape,
      });
    }
  }

  return Array.from(map.values());
}

// ✅ map ไทย <-> อังกฤษ
const toThaiStatus = (s: Joborder["status"]): OrderStatus => {
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
      return "ส่งสำเร็จ";
    default:
      return "รอตัด";
  }
};

type PatchPayload = {
  status?: status;
  customerId?: string;
  credit: number;
  steel?: {
    codeSteel: string;
    shape: ShapeSteel;
    amount: number;
    width?: number | null;
    length: number;
    thickness: number;
    weight?: number | null;
    detail?: string | null;

    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;

    job?: number | null;
    cuttingMethod?: CuttingMethod;
    discount?: number | null;
    price?: number;
  }[];
};

function buildPatchPayload(job: Joborder): PatchPayload {
  return {
    status: job.status,
    customerId: String(job.customerId),
    credit: job.credit,
    steel: job.steel.map((l) => ({
      codeSteel: l.steelType?.trim(),
      shape: l.shape,
      amount: Number(l.amount),
      width: l.width ?? null,
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

  const [job, setJob] = useState<Joborder | null>(null);
  const jobRef = React.useRef<Joborder | null>(null);

  const [steelOptions, setSteelOptions] = useState<SteelOption[]>([]);
  const [steelQuery, setSteelQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingSteel, setLoadingSteel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [useJob, setUseJob] = useState(false);

  // sync ref ให้ fetchSteel มองเห็น job ล่าสุดเสมอ
  useEffect(() => {
    jobRef.current = job;
  }, [job]);

  const hasAnyJob = (job?.steel ?? []).some((s) => s.job != null);
  useEffect(() => {
    if (hasAnyJob) setUseJob(true);
  }, [hasAnyJob]);

  const hasMissingJob = useJob && (job?.steel ?? []).some((s) => s.job == null);

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

      const data: SteelStockApiItem[] = await res.json();
      if (cancelledRef?.()) return;

      const options: SteelOption[] = data.map((x) => ({
        value: steelKey(x.codeSteel, x.shape),
        codeSteel: x.codeSteel,
        label: x.codeSteel,
        price: x.price,
        amount: x.amount ?? 0,
        shape: x.shape,
      }));

      // ✅ merge ให้มีเหล็กที่ออเดอร์ใช้อยู่เสมอ
      const merged = mergeOrderSteelIntoOptions(options, jobRef.current);

      setSteelOptions(merged);
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

        const mapped = toJoborder(data as ApiJobOrder);

        if (!cancelled) {
          setJob(mapped);
          jobRef.current = mapped; // ✅ ให้ fetchSteel รอบแรก merge ได้ทันที
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

  // const clearAllJobs = () => {
  //   setJob((prev) => {
  //     if (!prev) return prev;
  //     return {
  //       ...prev,
  //       steel: (prev.steel ?? []).map((s) => ({ ...s, job: null })),
  //     };
  //   });
  // };
  const validateForm = () => {
    if (!job) return "ไม่พบข้อมูลคำสั่งซื้อ";
    if (itemCount === 0) return "กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ";
    if (itemCount > 15)
      return "ไม่สามารถบันทึกคำสั่งซื้อที่มีรายการเหล็กเกิน 15 รายการได้";
    if (hasMissingJob) return "กรุณากรอกหมายเลขงาน (Job No.) ให้ครบทุกบรรทัด";

    if (isAtLeast(job.status, "weighing")) {
      const hasZeroWeight = job.steel.some(
        (s) => s.isPerAmount === false && (!s.weight || s.weight <= 0),
      );
      if (hasZeroWeight)
        return "กรุณากรอกน้ำหนักเหล็กกในรายการที่คิดราคาตามน้ำหนัก";
      const hasZeroPrice = job.steel.some((s) => !s.price || s.price <= 0);
      if (hasZeroPrice) return "กรุณากรอกราคาเหล็กก่อนบันทึกคำสั่งซื้อ";
    }
    if (
      job.steel.some(
        (s) =>
          s.length <= 0 ||
          s.thickness <= 0 ||
          (s.shape == "square" && (s.width == null || s.width <= 0)),
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

    // ✅ Guard เพื่อ TS + runtime
    if (!job) {
      toast.error("ขออภัย มีข้อผิดพลาด: ไม่พบข้อมูลคำสั่งซื้อ", {
        position: "bottom-right",
      });
      return;
    }

    const jobSnap = job; // ✅ จากนี้ไม่ต้อง job! แล้ว
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

      const badLine = payload.steel?.find((x) => !x.codeSteel?.trim());
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
      const mapped = toJoborder(data as ApiJobOrder);
      setJob(mapped);

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
  const weightEnabled =
    ORDER_STATUSES.indexOf(status) >= ORDER_STATUSES.indexOf("ชั่งน้ำหนัก");

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;

  // ✅ คำนวณจาก job.steel โดยตรง
  const itemCount = job.steel.length;
  const uniqueTypeCount = new Set(job.steel.map((i) => i.steelType)).size;
  const totalQty = job.steel.reduce(
    (sum, i) => sum + (Number(i.amount) || 0),
    0,
  );

  const totalWeight = weightEnabled
    ? job.steel.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.amount) || 0),
        0,
      )
    : 0;

  const summaryByType = job.steel.reduce(
    (acc, i) => {
      const key = i.steelType || "ไม่ระบุ";
      if (!acc[key]) acc[key] = { lines: 0, qty: 0, weight: 0 };
      acc[key].lines += 1;
      acc[key].qty += Number(i.amount) || 0;
      acc[key].weight += (Number(i.weight) || 0) * (Number(i.amount) || 0);
      return acc;
    },
    {} as Record<string, { lines: number; qty: number; weight: number }>,
  );

  const fmtInt = (n: number) => Intl.NumberFormat().format(n);
  const fmtWeight = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

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
        <DetailCustomer job={job} setJob={setJob} />

        {/* --- Section 3: Order Lines --- */}
        <DetailItem
          job={job}
          setJob={setJob}
          steelOptions={steelOptions}
          weightEnabled={weightEnabled}
          useJob={useJob}
          setUseJob={setUseJob}
        />

        {/* ---------- สรุป (อ่านจาก job.steel) ---------- */}
        <Summary
          job={job}
          weightEnabled={weightEnabled}
          fmtInt={fmtInt}
          fmtWeight={fmtWeight}
        />
      </main>
    </div>
  );
};

export default UpdateOrderPage;
