"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Update the import path below if your use-toast file is located elsewhere
import { toast } from "../../../hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import {
  ArrowLeft,
  FileText,
  Package,
  CalendarDays,
  User2,
  Hash,
  Printer,
  Edit,
  Building2,
  Factory,
  Truck,
} from "lucide-react";
import { QuickAction } from "@/components/jobordertail/QuickAction";
import { StaffInfoCard } from "@/components/jobordertail/StaffInfoCard";
import { CustomerTab } from "@/components/jobordertail/CustomerTab";
import { ProductionTab } from "@/components/jobordertail/ProductionTab";
import { DeliveryTab } from "@/components/jobordertail/DeliveryTab";
// Consolidate Card imports to use the local UI component for consistent styling
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "leaflet";
import { set } from "zod";
import th from "zod/v4/locales/th.cjs";
import { se } from "date-fns/locale";
import router from "next/router";
import SteelOrderTable from "@/components/jobordertail/SteelOrderTable";

type StaffMember = {
  id: number;
  name: string;
  role: "supervisor" | "cutter" | string;
};

type ApiJobOrder = {
  id: number;
  poNumber: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  customercode: string | null;

  staff: { id: number; name: string; role: "supervisor" | "cutter" | null }[];

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
    shape: string;
  }[];

  status: string;
  createdAt: string; // JSON -> string
  updatedAt: string; // JSON -> string
  deliveryDate: string;
  assignedCutter?: string | null;
  completedAt?: string | null;
};

const tojobOrder = (api: ApiJobOrder): JobOrder => {
  return {
    id: api.id.toString(),
    poNumber: api.poNumber,
    customerId: api.customerId,
    customerName: api.customerName,
    customerEmail: api.customerEmail,
    customerPhone: api.customerPhone,
    deliveryAddress: api.deliveryAddress,
    customercode: api.customercode,
    staff: (api.staff || []).map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
    })),

    steel: (api.steel || []).map((s) => ({
      steelType: s.steelType,
      amount: s.amount,
      width: s.width ?? null,
      length: s.length ?? null,
      thickness: s.thickness ?? null,
      price: s.price ?? 0,
      weight: s.weight ?? 0,
      detail: s.detail ?? undefined,
      density: s.density ?? 0,
      shape: s.shape,
    })),
    status: api.status as JobOrder["status"],
    createdAt: new Date(api.createdAt),

    deliveryDate: new Date(api.deliveryDate),
    updatedAt: new Date(api.updatedAt),
    assignedCutter: api.assignedCutter ?? undefined,
    completedAt: api.completedAt ? new Date(api.completedAt) : undefined,
  };
};

interface JobOrder {
  id: string;
  poNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  customercode: string;
  staff: Array<{
    id: number;
    name: string;
    role: "supervisor" | "cutter" | string;
  }>;
  steel: Array<{
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
  }>;
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
  createdAt: Date;
  deliveryDate?: Date;
  updatedAt: Date;
  assignedCutter?: string;
  completedAt?: Date;
}

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

  const supervisors: StaffMember[] =
    jobOrder?.staff.filter((s) => s.role === "supervisor") ?? [];
  const technicians: StaffMember[] =
    jobOrder?.staff.filter((s) => s.role === "cutter") ?? [];

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
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleStatusUpdate = (newStatus: JobOrder["status"]) => {
    if (jobOrder) {
      setJobOrder({ ...jobOrder, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Job order status changed to ${newStatus.toUpperCase()}`,
      });
    }
  };

  // Loading state
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

  //   return (
  //       <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
  //         <div className="text-center">
  //           <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
  //           <h2 className="text-2xl font-bold mb-2">ไม่พบรายการออเดอร์</h2>
  //           <p className="text-muted-foreground mb-4">ไม่สามารถหารายการออเดอร์นี้ได้โปรดลองอีกครั้ง</p>
  //           <Button onClick={() => router.push("/dashboard")}>
  //             <ArrowLeft className="mr-2 h-4 w-4" />
  //             กลับสู่หน้าหลัก
  //           </Button>
  //         </div>
  //       </div>
  //     );
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
      <pre className="text-xs overflow-auto p-3 border rounded">
        {JSON.stringify(jobOrder, null, 2)}
      </pre>

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
                  {jobOrder?.status?.toUpperCase() || "N/A"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 border-amber-200"
                >
                  ด่วน
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                จัดการข้อมูลการผลิต สถานะ และการจัดส่งสำหรับ PO:{" "}
                {jobOrder?.poNumber || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            {/* <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="h-4 w-4" /> PDF
            </Button> */}
            <Button size="sm" className="h-9 gap-2 text-white">
              <Edit className="h-4 w-4" /> Edit Order
            </Button>
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
                    value={supervisors[0]?.name || "N/A"}
                    icon={User2}
                  />
                </div>
              </div>
            </Card>

            {/* Steel Order Table */}
            <SteelOrderTable steel={jobOrder?.steel || []} />

            {/* Tabs Card */}
            <Card className="rounded-lg shadow-md ">
              {/* Tabs Header */}
              <Tabs defaultValue="StaffInfo" className="w-full">
                {/* mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12 */}
                {/* 1. Header Section: เพิ่มพื้นหลังจางๆ และเส้นขอบ */}
                <div className="border-b bg-muted/10 px-6 pt-2 dark:border-zinc-800">
                  <TabsList className="flex mb-3 h-auto w-full justify-start gap-8 bg-transparent p-0">
                    {[
                      { id: "StaffInfo", label: "Staff Info", icon: User2 },
                      { id: "Customer", label: "Customer", icon: Building2 },
                      { id: "Production", label: "Production", icon: Factory },
                      { id: "Delivery", label: "Delivery", icon: Truck },
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
                <TabsContent value="StaffInfo" className="mt-1">
                  <StaffInfoCard
                    jobOrderId={id}
                    supervisorName={supervisors}
                    technicians={technicians}
                  />
                </TabsContent>

                {/* Customer */}
                <TabsContent value="Customer" className="mt-1">
                  <CustomerTab
                    customer={{
                      name: jobOrder?.customerName,
                      email: jobOrder?.customerEmail,
                      code: jobOrder?.customercode,
                      phone: jobOrder?.customerPhone,
                      shippingAddress: jobOrder?.deliveryAddress,
                    }}
                  />
                </TabsContent>

                {/* Production */}
                <TabsContent value="Production" className="mt-2">
                  <ProductionTab
                    status={jobOrder?.status || "pending"}
                    assignedCutter={jobOrder?.assignedCutter || ""}
                    onUpdateStatus={handleStatusUpdate}
                    getStatusColor={getStatusColor}
                  />
                </TabsContent>

                {/* Delivery */}
                <TabsContent value="Delivery" className="mt-0">
                  <DeliveryTab
                    status={jobOrder?.status || "pending"}
                    deliveryDate={jobOrder?.deliveryDate.toLocaleDateString()}
                    deliveryAddress={jobOrder?.deliveryAddress}
                    onUpdateStatus={handleStatusUpdate}
                    className=""
                    items={jobOrder?.steel || []}
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
              <QuickAction orderId={jobOrder?.id || ""} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
};

export default JobOrderDetailPage;
