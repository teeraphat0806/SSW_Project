"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  CircleDashed,
  Scissors,
  Scale,
  CheckCircle2,
  ClipboardCheck,
  Truck,
  PackageCheck,
  Plus,
  ListChecks,
  Trash2,
  Phone,
  FileText,
  Mail,
  Printer,
  MapPin,
  User,
  Building2,
  Calculator,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { de } from "zod/v4/locales";
import DetailCustomer from "@/components/up-date-order/detailCustomer";
import DetailItem from "@/components/up-date-order/detailItem";
import Summary from "@/components/up-date-order/summary";
import Stepper from "@/components/up-date-order/stepper";
// ✅ ไม่ได้ใช้ เอาออกได้ (ถ้าจะใช้ค่อยใส่กลับ)
// import { ca, th } from "date-fns/locale";

type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTaxId: string;
  customerCode: string;
  customerFax: string;
  steel: {
    steelType: string;
    amount: number;
    width?: number;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: "square" | "line";
  }[];
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
};

type Joborder = {
  id: string;
  ponumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerTaxId: string;
  customerCode: string;
  customerFax: string;
  steel: {
    steeltype: string;
    quantity: number;
    width?: number | null;
    length: number;
    thickness: number;
    detail?: string | null;
    weight?: number | null;
    shape: "square" | "line";
  }[];
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
};

const toJoborder = (api: ApiJobOrder): Joborder => ({
  id: api.id.toString(),
  ponumber: api.poNumber,
  customerId: api.customerId ?? "",
  customerName: api.customerName ?? "",
  customerEmail: api.customerEmail ?? "",
  customerPhone: api.customerPhone ?? "",
  customerAddress: api.customerAddress ?? "",
  customerTaxId: api.customerTaxId ?? "",
  customerCode: api.customerCode ?? "",
  customerFax: api.customerFax ?? "",
  steel: (api.steel ?? []).map((s) => ({
    steeltype: s.steelType,
    quantity: s.amount,
    width: s.width ?? null,
    length: s.length,
    thickness: s.thickness,
    detail: s.detail ?? null,
    weight: s.weight ?? null,
    shape: s.shape,
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

const steelOptions: { value: string; label: string; quantity: number }[] = [
  { value: "SS400", label: "SS400", quantity: 10 },
  { value: "SKD11", label: "SKD11", quantity: 5 },
  { value: "SKD61", label: "SKD61", quantity: 8 },
  { value: "S45C", label: "S45C", quantity: 12 },
  { value: "SCM440", label: "SCM440", quantity: 7 },
];

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

const toApiStatus = (s: OrderStatus): Joborder["status"] => {
  switch (s) {
    case "รอตัด":
      return "pending";
    case "กำลังตัด":
      return "cutting";
    case "ชั่งน้ำหนัก":
      return "weighing";
    case "ตัดเสร็จสิ้น":
      return "ready";
    case "กำลังส่ง":
      return "shipped";
    case "ส่งสำเร็จ":
      return "completed";
    default:
      return "pending";
  }
};

const UpdateOrderPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [job, setJob] = useState<Joborder | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch order");
        }

        const mapped = toJoborder(data as ApiJobOrder);

        if (!cancelled) setJob(mapped);
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to fetch job order"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job order details...</p>
        </div>
      </div>
    );
  }
  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error ไม่พบข้อมูลคำสั่งซื้อ</p>
        </div>
      </div>
    );
  }

  const status: OrderStatus = toThaiStatus(job.status);
  const weightEnabled =
    ORDER_STATUSES.indexOf(status) >= ORDER_STATUSES.indexOf("ชั่งน้ำหนัก");

  const currentStep = ORDER_STATUSES.indexOf(status);
  const progressPct = (currentStep / (ORDER_STATUSES.length - 1)) * 100;

  // ✅ คำนวณจาก job.steel โดยตรง
  const itemCount = job.steel.length;
  const uniqueTypeCount = new Set(job.steel.map((i) => i.steeltype)).size;
  const totalQty = job.steel.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0),
    0
  );

  const totalWeight = weightEnabled
    ? job.steel.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.quantity) || 0),
        0
      )
    : 0;

  const summaryByType = job.steel.reduce((acc, i) => {
    const key = i.steeltype || "ไม่ระบุ";
    if (!acc[key]) acc[key] = { lines: 0, qty: 0, weight: 0 };
    acc[key].lines += 1;
    acc[key].qty += Number(i.quantity) || 0;
    acc[key].weight += (Number(i.weight) || 0) * (Number(i.quantity) || 0);
    return acc;
  }, {} as Record<string, { lines: number; qty: number; weight: number }>);

  const fmtInt = (n: number) => Intl.NumberFormat().format(n);
  const fmtWeight = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <div>
      {/*Header*/}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
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
                {/* ✅ ดึงจาก mockJoborder */}
                <p className="text-sm text-muted-foreground font-mono">
                  {job.ponumber}
                </p>
              </div>
            </div>
          </div>

          <Button className="bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none">
            บันทึกข้อมูล
          </Button>
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
