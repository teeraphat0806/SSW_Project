"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, FileText, Package, Truck, Calendar } from "lucide-react";
import { QuickAction } from "../../components/jobordertail/QuickAction";
import { SteelTable } from "../../components/jobordertail/SteelTable";
import { SpecificationsTab } from "../../components/jobordertail/SpecificationsTab";
import { CustomerTab } from "../../components/jobordertail/CustomerTab";
import { ProductionTab } from "../../components/jobordertail/ProductionTab";
import { DeliveryTab } from "../../components/jobordertail/DeliveryTab";

interface JobOrder {
  id: string;
  poNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  steelType: string;
  quantity: number;
  width: number;
  length: number;
  thickness: number;
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
  priority: "low" | "normal" | "high" | "urgent";
  weight?: number;
  price?: number;
  createdAt: Date;
  deliveryDate?: string;
  specialInstructions?: string;
  assignedCutter?: string;
  completedAt?: Date;
  estimatedWeight?: number;
  actualDimensions?: {
    width: number;
    length: number;
    thickness: number;
  };
}

const mockJobOrder: JobOrder = {
  id: "JO-001",
  poNumber: "PO-2024-001",
  customerName: "ABC Manufacturing Ltd.",
  customerEmail: "procurement@abc-manufacturing.com",
  customerPhone: "+1 (555) 123-4567",
  deliveryAddress:
    "123 Industrial Avenue, Manufacturing District, Metro City, State 12345",
  steelType: "Carbon Steel",
  quantity: 50,
  width: 100,
  length: 200,
  thickness: 5,
  status: "cutting",
  priority: "high",
  weight: 245.5,
  price: 2450.0,
  createdAt: new Date("2024-01-15T09:30:00"),
  deliveryDate: "2024-01-20",
  specialInstructions:
    "Handle with care - precision cutting required for automotive parts. Ensure smooth edges.",
  assignedCutter: "John Smith",
  estimatedWeight: 240.0,
  actualDimensions: {
    width: 99.8,
    length: 199.9,
    thickness: 5.0,
  },
};

const JobOrderDetailPage = () => {
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  useEffect(() => {
    const fetchJobOrder = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setJobOrder(mockJobOrder);
      setLoading(false);
    };

    fetchJobOrder();
  }, []);
  const router = useRouter();

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
    <div className="min-h-screen md:pl-24">
      {/* Top nav + actions */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-base font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                รายละเอียดออเดอร์
              </h1>
              <p className="text-sm text-muted-foreground">
                รายละเอียดออเดอร์แบบครบถ้วน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Print
            </button>
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Download PDF
            </button>
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Edit Order
            </button>
          </div>
        </div>

        {/* Grid layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* LEFT COLUMN */}
          <section className="xl:col-span-9 space-y-6">
            {/* Order Overview Card */}
            <div className="rounded-2xl border border-gray-200">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-lg  font-bold text-foreground">
                      ภาพรวมออเดอร์
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      เลขที่ใบ PO : PO-2024-001
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(jobOrder.status)}>
                    {jobOrder.status.toUpperCase()}
                  </Badge>

                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    ด่วน
                  </span>
                </div>
              </div>
              {/* Content Box*/}
              <div className="space-y-6 p-5">
                {/* Order Info */}
                <h3 className="mb-3 text-base font-semibold text-foreground">
                  ข้อมูลออเดอร์
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <dl className="grid [grid-template-columns:140px_1fr] gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Order ID :</dt>
                    <dd className="font-medium">001</dd>

                    <dt className="text-muted-foreground">
                      สร้างออเดอร์เมื่อ :
                    </dt>
                    <dd className="font-medium">
                      <time dateTime="2024-01-15">1/15/2024</time>
                    </dd>
                  </dl>
                  <dl className="grid [grid-template-columns:140px_1fr] gap-y-2 text-sm">
                    <dt className="text-muted-foreground">
                      วันที่ต้องจัดส่ง :
                    </dt>
                    <dd className="font-medium">
                      <time dateTime="2024-02-24">2/24/2024</time>
                    </dd>

                    <dt className="text-muted-foreground">ผู้รับผิดชอบตัด :</dt>
                    <dd className="font-medium">สมชาย ใจดี</dd>
                  </dl>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* ซ้าย: ข้อมูลเหล็ก (คำนวณ) */}
                  <SteelTable
                    title="ข้อมูลเหล็ก (คำนวณ)"
                    rows={[
                      { type: "แผ่น SS400 4x8", weightKg: 120, price: 9500 },
                      { type: "กลม 12 มม.", weightKg: 60, price: 4100 },
                      { type: "ฉาก 40x40", weightKg: 45.5, price: 3100 },
                    ]}
                  />

                  {/* ขวา: ข้อมูลเหล็ก (จริง) */}
                  <SteelTable
                    title="ข้อมูลเหล็ก (จริง)"
                    rows={[
                      { type: "แผ่น SS400 4x8", weightKg: 121.3, price: 9625 },
                      { type: "กลม 12 มม.", weightKg: 61.2, price: 4185 },
                      { type: "ฉาก 40x40", weightKg: 46.0, price: 3140 },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Tabs Card */}
            <div className="rounded-2xl border border-gray-200 bg-background shadow-sm px-2 py-2">
              {/* Tabs Header */}
              <Tabs defaultValue="specifications" className="w-full">
                {/* mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12 */}
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  <TabsTrigger value="specifications">
                    Specifications
                  </TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="production">Production</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>

                {/* Specifications */}
                <TabsContent value="specifications">
                  <SpecificationsTab
                    steelSpec={{
                      type: "Carbon Steel",
                      quantity: "50 pieces",
                      width: "100 mm",
                      length: "2000 mm",
                      thickness: "5 mm",
                    }}
                    actual={{
                      width: "99.8 mm",
                      length: "199.9 mm",
                      thickness: "5 mm",
                    }}
                    note="Handle with care – precision cutting required for automotive parts. Ensure smooth edges."
                  />

                   <SpecificationsTab
                    steelSpec={{
                      type: "Carbon Steel",
                      quantity: "50 pieces",
                      width: "100 mm",
                      length: "2000 mm",
                      thickness: "5 mm",
                    }}
                    actual={{
                      width: "99.8 mm",
                      length: "199.9 mm",
                      thickness: "5 mm",
                    }}
                    note="Handle with care – precision cutting required for automotive parts. Ensure smooth edges."
                  />
                </TabsContent>

                {/* Customer */}
                <TabsContent value="customer">
                  <CustomerTab
                    customer={{
                      name: "บริษัท จำกัด",
                      email: "arm1532arm@gmail.com",
                      phone: "0655389857",
                      shippingAddress:
                        "ตำบล บางรัก อำเภอ เมือง จังหวัด กรุงเทพ 10500",
                    }}
                  />
                </TabsContent>

                {/* Production */}
                <TabsContent value="production">
                  <ProductionTab
                    status={jobOrder.status}
                    assignedCutter={jobOrder.assignedCutter}
                    onUpdateStatus={handleStatusUpdate}
                    getStatusColor={getStatusColor}
                  />
                </TabsContent>

                {/* Delivery */}
                <TabsContent value="delivery">
                  <DeliveryTab
                    status={jobOrder.status}
                    deliveryDate={jobOrder.deliveryDate}
                    deliveryAddress={jobOrder.deliveryAddress}
                    onUpdateStatus={handleStatusUpdate}
                    className=""
                  />
                </TabsContent>
              </Tabs>

              {/* Tab body: Specifications */}
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="xl:col-span-3 space-y-6">
            {/* Quick Actions */}

            <div className="mt-3 grid gap-2">
              <QuickAction orderId={jobOrder.id} />
            </div>

            {/* Activity Timeline */}
            {/* <div className="rounded-2xl border border-gray-200 bg-background p-5 shadow-sm">
              <h3 className="text-base font-semibold">Activity Timeline</h3>
              <ol className="mt-3 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-gray-500">
                      1/15/2024, 9:30:16 AM
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Cutting Started</p>
                    <p className="text-xs text-gray-500">
                      Assigned to John Smith
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 opacity-70">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Awaiting Completion</p>
                    <p className="text-xs text-gray-500">In progress…</p>
                  </div>
                </li>
              </ol>
            </div> */}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default JobOrderDetailPage;
