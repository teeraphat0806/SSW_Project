"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";

import {
  ArrowLeft,
  FileText,
  Package,
  CalendarDays,
  User2,
  Hash,
  Edit,
  Building2,
  Factory,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { QuickAction } from "@/components/jobordertail/QuickAction";
import { StaffInfoCard } from "@/components/jobordertail/StaffInfoCard";
import { CustomerTab } from "@/components/jobordertail/CustomerTab";
import { ProductionTab } from "@/components/jobordertail/ProductionTab";
import { DeliveryTab } from "@/components/jobordertail/DeliveryTab";
import { Card } from "@/components/ui/card";
import SteelOrderTable from "@/components/jobordertail/SteelOrderTable";
import { CancelOrderButton } from "@/components/jobordertail/cancelOrderButton";

import { LoadingScreen } from "@/components/Loading";
import { toast } from "react-toastify";
import { CompletionTab } from "@/components/jobordertail/CompletionTab";
import { calculateBillSummary } from "@/lib/calculateGrandTotal";
import { CuttingMethod, ShapeSteel, status } from "@/types";

type StaffMember = {
  id: number;
  name: string;
  role: "supervisor" | "cutter";
};

type ApiJobOrder = {
  id: number;
  billid: number;
  poNumber: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  key: string[];
  supervisors: StaffMember[];
  technicians: StaffMember[];
  vatRate: number | null;

  steel: {
    steelType: string;
    amount: number;
    width?: number | null;
    length?: number | null;
    thickness?: number | null;
    price: number | null;
    weight: number | null;
    density: number | null;
    detail?: string | null;
    shape: ShapeSteel;
    job?: number | null;
    discount?: number | null;
    cuttingMethod: CuttingMethod;
    isOD?: boolean | null;
    isServices?: boolean | null;
    isPerAmount?: boolean | null;
  }[];

  status: status;
  createdAt: string;
  updatedAt: string;
  deliveryDate: string;
  assignedCutter?: string | null;
  completedAt?: string | null;
};

export type JobOrder = {
  id: string;
  billid: number;
  poNumber: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  key: string[];
  supervisors: StaffMember[];
  technicians: StaffMember[];
  vatRate: number;
  steel: Array<{
    steelType: string;
    amount: number;
    width?: number; // ? หมายถึง number | undefined (ห้าม null)
    length?: number;
    thickness?: number;
    price: number;
    weight: number;
    detail?: string;
    density: number;
    job?: number;
    discount?: number | null;
    cuttingMethod: CuttingMethod;
    shape: ShapeSteel;
    isOD: boolean;
    isServices: boolean;
    isPerAmount: boolean;
  }>;
  status: status;
  createdAt: Date;
  deliveryDate: Date;
  updatedAt: Date;
  assignedCutter?: string;
  completedAt?: Date;
};

// --- DATA MAPPING FUNCTION (จุดสำคัญที่แก้ไข) ---

const tojobOrder = (api: ApiJobOrder): JobOrder => {
  return {
    id: api.id.toString(),
    poNumber: api.poNumber ?? null,
    billid: api.billid,
    // ✅ ใช้ ?? "" เพื่อแปลง null เป็น empty string
    customerId: api.customerId ?? "",
    customerName: api.customerName ?? "",
    customerEmail: api.customerEmail ?? undefined,
    customerPhone: api.customerPhone ?? undefined,
    deliveryAddress: api.deliveryAddress ?? "",
    key: api.key ?? [],
    supervisors: api.supervisors,
    technicians: api.technicians,
    vatRate: api.vatRate ?? 7,
    steel: (api.steel || []).map((s) => ({
      steelType: s.steelType,
      amount: s.amount,
      // ✅ เปลี่ยนจาก ?? null เป็น ?? undefined เพื่อให้ตรงกับ type optional (?)
      width: s.width ?? undefined,
      length: s.length ?? undefined,
      thickness: s.thickness ?? undefined,
      // ✅ แปลง null price/weight เป็น 0
      price: s.price ?? 0,
      weight: s.weight ?? 0,
      density: s.density ?? 0,
      detail: s.detail ?? undefined,
      job: s.job ?? undefined,
      cuttingMethod: (s.cuttingMethod ??
        "normal") as JobOrder["steel"][number]["cuttingMethod"],
      discount: s.discount ?? undefined,
      shape: s.shape as ShapeSteel,
      isOD: s.isOD ?? false,
      isServices: s.isServices ?? false,
      isPerAmount: s.isPerAmount ?? false,
    })),

    // ✅ Type Assertion สำหรับ Status และ fallback เป็น pending
    status: (api.status as JobOrder["status"]) || "pending",

    createdAt: new Date(api.createdAt),
    deliveryDate: new Date(api.deliveryDate),
    updatedAt: new Date(api.updatedAt),
    assignedCutter: api.assignedCutter ?? undefined,
    completedAt: api.completedAt ? new Date(api.completedAt) : undefined,
  };
};

const InfoStat = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
}) => (
  <div className="flex items-start gap-3 rounded-lg border p-3 bg-background hover:bg-hover transition-colors">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border shadow-sm text-primary">
      {Icon && <Icon className="h-5 w-5" />}
    </div>
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  </div>
);
const JobOrderDetailPage = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchJobOrder = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/job-order-detail/${id}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const apiData: ApiJobOrder = await response.json();
        const mapped = tojobOrder(apiData);

        setJobOrder(mapped);
        console.log("mapped jobOrder:", mapped); // ✅ log ตัวที่แปลงแล้ว
      } catch (error) {
        console.error("Failed to fetch job order:", error);
        setJobOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOrder();
  }, [id]);

  const getStatusColor = (status: JobOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-warning text-warning-foreground";
      case "cutting":
        return "bg-primary text-primary-foreground";
      case "weighing":
        return "bg-steel text-foreground";
      case "ready":
        return "bg-success text-success-foreground";
      case "shipped":
        return "bg-primary text-primary-foreground";
      case "completed":
        return "bg-success text-success-foreground";
      case "canceled":
        return "bg-destructive text-destructive-foreground";

      default:
        return "bg-muted text-muted-foreground";
    }
  };
  // ✅ ฟังก์ชันอัปเดตสถานะผ่าน API

  const handleStatusUpdate = async (newStatus: JobOrder["status"]) => {
    if (!jobOrder) return;

    if (newStatus === "ready") {
      const hasInvalidWeight = jobOrder.steel.some(
        (s) => s.isPerAmount === false && (!s.weight || s.weight <= 0),
      );
      if (hasInvalidWeight) {
        toast.error(
          "ยังไปขั้นตอนถัดไปไม่ได้: ต้องกรอกน้ำหนักเหล็กก่อน แล้วจึงเปลี่ยนเป็น READY ได้",
          {
            position: "bottom-right",
          },
        );
        console.log("Cannot change to READY: Weight missing");

        return;
      }
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/job-order-detail/${jobOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // 1. เช็คสิทธิ์การเข้าถึงก่อน (401/403) ป้องกันกรณี Response body ไม่ใช่ JSON
        if (response.status === 401 || response.status === 403) {
          toast.error(
            "ไม่มีสิทธิ์เข้าถึง (Access Denied): คุณไม่มีสิทธิ์ในการแก้ไขสถานะนี้",
            {
              position: "bottom-right",
            },
          );
          console.error("Access Denied: No permission to update status");

          return; // สำคัญ: ไม่ throw
        }

        // 2. ถ้าไม่ใช่เรื่องสิทธิ์ ค่อยดึง Error message จาก API
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update status");
      }

      // Success: อัปเดต Local State
      setJobOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      toast.success(
        `เปลี่ยนสถานะเป็น ${toThaiStatus(newStatus)} เรียบร้อยแล้ว`,
        {
          position: "bottom-right",
        },
      );
      console.log("Status updated successfully");
    } catch (error: any) {
      console.error("Update Error:", error);

      // ตรวจสอบข้อความ Error เพื่อเปลี่ยน Title ของ Toast ให้สื่อความหมาย
      const isPermissionError =
        error.message === "คุณไม่มีสิทธิ์ในการแก้ไขสถานะนี้";

      toast.error(
        isPermissionError
          ? "ไม่มีสิทธิ์เข้าถึง (Access Denied)"
          : "การดำเนินการล้มเหลว: " +
              (error.message || "ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง"),
        {
          position: "bottom-right",
        },
      );
    } finally {
      setIsUpdating(false);
    }
  };
  const handleCancelOrder = async () => {
    if (!jobOrder) return;

    // ถ้ายกเลิกแล้ว ไม่ต้องทำซ้ำ
    if (jobOrder.status === "canceled") {
      toast.error("ออเดอร์ถูกยกเลิกแล้ว ไม่สามารถยกเลิกซ้ำได้", {
        position: "bottom-right",
      });
      console.log("Order already canceled");

      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/job-order-detail/${jobOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled" }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error(
            "ไม่มีสิทธิ์เข้าถึง (Access Denied): คุณไม่มีสิทธิ์ยกเลิกออเดอร์นี้",
            {
              position: "bottom-right",
            },
          );
          console.error("Access Denied: No permission to cancel this order");

          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to cancel order");
      }

      setJobOrder((prev) => (prev ? { ...prev, status: "canceled" } : null));
      toast.success(`ยกเลิกออเดอร์ #${jobOrder.id} สำเร็จ`, {
        position: "bottom-right",
      });
      console.log("Order canceled successfully");
    } catch (error: any) {
      toast.error(
        "ยกเลิกล้มเหลว: " + (error.message || "ไม่สามารถยกเลิกออเดอร์ได้"),
        {
          position: "bottom-right",
        },
      );
      console.error("Cancel Error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toThaiStatus = (s: status): string => {
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
      case "canceled":
        return "ยกเลิก";
      default:
        return "รอตัด";
    }
  };

  // Loading state
  if (loading) {
    return <LoadingScreen message="กำลังโหลดรายละเอียดออเดอร์..." />;
  }

  return (
    <>
      {/* Top nav + actions */}
      <header className="sticky top-0 z-40 border-b bg-background backdrop-blur-sm shadow-sm dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับสู่หน้าหลัก
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              แก้ไขล่าสุดเมื่อ:
              {jobOrder?.updatedAt.toLocaleDateString() || "N/A"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* --- Page Header & Actions --- */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  รายละเอียดออเดอร์ #{jobOrder?.id || "N/A"}
                </h1>
                <Badge
                  variant="outline"
                  className={getStatusColor(jobOrder?.status || "pending")}
                >
                  {toThaiStatus(jobOrder?.status || "pending")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                จัดการข้อมูลการผลิต สถานะ และการจัดส่งสำหรับ PO:{" "}
                {jobOrder?.poNumber || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CancelOrderButton
              jobOrder={jobOrder}
              isUpdating={isUpdating}
              onConfirm={handleCancelOrder}
            />
            {jobOrder?.status === "canceled" ? (
              <></>
            ) : (
              <Button
                size="sm"
                className="h-9 gap-2 text-white"
                onClick={() => router.push("/up-date-order/" + id)}
              >
                <Edit className="h-4 w-4" /> แก้ไขออเดอร์
              </Button>
            )}
          </div>
        </div>

        {/* Grid layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12 ">
          {/* LEFT COLUMN */}
          <section className="xl:col-span-9 space-y-6 ">
            {/* Order Overview Card */}

            {/* Content Box*/}
            <Card>
              <div className="space-y-6 p-5">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoStat
                    label="Order ID"
                    value={`#${jobOrder?.id || ""}`}
                    icon={Hash}
                  />
                  <InfoStat
                    label="เลขที่ใบสั่งซื้อ (PO)"
                    value={jobOrder?.poNumber || "N/A"}
                    icon={FileText}
                  />
                  <InfoStat
                    label="กำหนดส่งสินค้า"
                    value={
                      jobOrder?.deliveryDate.toLocaleDateString("th-TH") ||
                      "N/A"
                    }
                    icon={CalendarDays}
                  />
                  <InfoStat
                    label="ผู้รับผิดชอบ (ตัด)"
                    value={jobOrder?.supervisors[0]?.name || "N/A"}
                    icon={User2}
                  />
                </div>
              </div>
            </Card>

            {/* Steel Order Table */}
            <SteelOrderTable
              steel={jobOrder?.steel || []}
              vatRate={jobOrder?.vatRate || 7}
            />

            {/* Tabs Card */}
            <Card className="rounded-lg shadow-md ">
              {/* Tabs Header */}
              <Tabs defaultValue="Production" className="w-full  ">
                {/* mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12 */}
                {/* 1. Header Section: เพิ่มพื้นหลังจางๆ และเส้นขอบ */}
                <div className=" border-b bg-muted/10 px-6 pt-2 dark:border-zinc-800 overflow-x-auto">
                  <TabsList className="flex mb-3 h-auto w-full justify-start gap-8 bg-transparent p-0">
                    {[
                      { id: "Production", label: "การผลิต", icon: Factory },
                      { id: "Delivery", label: "การจัดส่ง", icon: Truck },
                      {
                        id: "Completion",
                        label: "เสร็จสิ้น",
                        icon: CheckCircle2,
                      },
                      { id: "StaffInfo", label: "ข้อมูลพนักงาน", icon: User2 },
                      {
                        id: "Customer",
                        label: "ลูกค้า",
                        icon: Building2,
                      },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="group relative flex items-center gap-2 rounded-xl border-b-[3px] border-transparent pb-4 pt-4 text-sm font-medium text-muted-foreground transition-all 
            hover:text-wight 
            data-[state=active]:border-primary 
            data-[state=active]:text-white 
            data-[state=active]:shadow-none
            dark:data-[state=active]:text-white"
                      >
                        {/* Icon พร้อม Effect เปลี่ยนสี */}
                        <tab.icon className="h-4 w-4 transition-transform group-data-[state=active]:scale-110" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                {/* Specifications */}

                {/* Production */}
                <TabsContent value="Production" className="mt-2">
                  <ProductionTab
                    status={
                      (jobOrder?.status || "pending") as Exclude<
                        JobOrder["status"],
                        "canceled"
                      >
                    }
                    onUpdateStatus={handleStatusUpdate}
                    getStatusColor={getStatusColor}
                  />
                </TabsContent>

                {/* Delivery */}
                <TabsContent value="Delivery" className="mt-0">
                  <DeliveryTab
                    status={
                      (jobOrder?.status || "pending") as Exclude<
                        JobOrder["status"],
                        "canceled"
                      >
                    }
                    deliveryDate={
                      jobOrder?.deliveryDate
                        ? jobOrder.deliveryDate.toLocaleDateString("th-TH")
                        : "-"
                    }

                    deliveryAddress={jobOrder?.deliveryAddress ?? "-"}
                    onUpdateStatus={handleStatusUpdate}
                    className=""
                    items={jobOrder?.steel || []}
                  />
                </TabsContent>

                <TabsContent value="Completion" className="mt-0">
                  <CompletionTab
                    jobOrder={jobOrder}
                    onUpdateStatus={handleStatusUpdate}
                  />
                </TabsContent>

                <TabsContent value="StaffInfo" className="mt-1">
                  <StaffInfoCard
                    jobOrderId={id}
                    supervisorName={jobOrder?.supervisors}
                    technicians={jobOrder?.technicians}
                  />
                </TabsContent>

                {/* Customer */}
                <TabsContent value="Customer" className="mt-1">
                  <CustomerTab
                    customer={{
                      // ✅ ใช้ ?? "" เพื่อบอกว่า ถ้าเป็น undefined ให้ส่ง "" ไปแทน
                      id: jobOrder?.customerId ?? "",
                      name: jobOrder?.customerName ?? "",
                      email: jobOrder?.customerEmail ?? "-",
                      phone: jobOrder?.customerPhone ?? "-",
                      shippingAddress: jobOrder?.deliveryAddress ?? "",
                    }}
                  />
                </TabsContent>
              </Tabs>

              {/* Tab body: Specifications */}
            </Card>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="xl:col-span-3 space-y-6">
            {/* Quick Actions */}

            <div className="mt-3 grid gap-2">
              <QuickAction
                orderId={id}
                status={jobOrder?.status || "pending"}
                keyPo={jobOrder?.key || []}
                billid={jobOrder?.billid || ""}
              />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
};

export default JobOrderDetailPage;