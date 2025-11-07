"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
// Update the import path below if your use-toast file is located elsewhere
import { toast } from "../../hooks/use-toast";
import { Badge } from "../../components/ui/badge";

import {
  ArrowLeft,
  FileText,
  Package,
  CalendarRange,
  CalendarDays,
  User2,
  Hash,
} from "lucide-react";
import { QuickAction } from "../../components/jobordertail/QuickAction";
import { SteelTable } from "../../components/jobordertail/SteelTable";
import { StaffInfoCard } from "../../components/jobordertail/StaffInfoCard";
import { CustomerTab } from "../../components/jobordertail/CustomerTab";
import { ProductionTab } from "../../components/jobordertail/ProductionTab";
import { DeliveryTab } from "../../components/jobordertail/DeliveryTab";

interface JobOrder {
  id: string;
  poNumber: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  steel: Array<{
    steelType: string;
    amount: number;
    width: number;
    length: number;
    thickness: number;
    price: number;
    weight: number;
    specialInstructions?: string;
  }>;
  steelActual?: Array<{
    steelType: string;
    amount?: number;
    quantity?: number;
    width: number;
    length: number;
    thickness: number;
    price: number;
    weight: number;
  }>;
  status:
    | "pending"
    | "cutting"
    | "weighing"
    | "ready"
    | "shipped"
    | "completed";
  createdAt: Date;
  deliveryDate?: string;
  assignedCutter?: string;
  completedAt?: Date;
}

const mockJobOrder: JobOrder = {
  id: "1",
  poNumber: "PO-2024-001",
  customerId: "CUST-001",
  customerEmail: "customer@example.com",
  customerPhone: "0123456789",
  deliveryAddress: "123 Main St, Bangkok, Thailand",
  steel: [
    {
      steelType: "แผ่น SS400 4x8",
      amount: 10,
      width: 1200,
      length: 2400,
      thickness: 6,
      price: 9500,
      weight: 120,
    },
    {
      steelType: "กลม 12 มม.",
      amount: 20,
      width: 12,
      length: 6000,
      thickness: 12,
      price: 4100,
      weight: 60,
    },
    {
      steelType: "ฉาก 40x40",
      amount: 15,
      width: 40,
      length: 6000,
      thickness: 4,
      price: 3100,
      weight: 45.5,
    },
  ],
  steelActual: [
    {
      steelType: "แผ่น SS400 4x8",
      amount: 10,
      width: 1200,
      length: 2400,
      thickness: 6,
      price: 9625,
      weight: 121.3,
    },
    {
      steelType: "กลม 12 มม.",
      amount: 20,
      width: 12,
      length: 6000,
      thickness: 12,
      price: 4185,
      weight: 61.2,
    },
  ],
  status: "pending",
  createdAt: new Date("2024-01-15T09:30:16"),
  deliveryDate: "2024-02-24",
};

type InfoItemProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
};

const InfoItem = ({ label, value, icon }: InfoItemProps) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-6 w-6 items-center justify-center">
      <span className="text-muted-foreground">
        {icon}
      </span>
    </div>
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-muted-foreground tracking-wide">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  </div>
);

const JobOrderDetailPage = () => {
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  useEffect(() => {
    const fetchJobOrder = async () => {
      setJobOrder(mockJobOrder);
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

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
                <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          ข้อมูลออเดอร์
        </h3>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoItem
          label="Order ID"
          value="001"
          icon={<Hash className="w-4 h-4" />}
        />
        <InfoItem
          label="สร้างออเดอร์เมื่อ"
          value={<time dateTime="2024-01-15">15/01/2024</time>}
          icon={<CalendarRange className="w-4 h-4" />}
        />
        <InfoItem
          label="วันที่ต้องจัดส่ง"
          value={<time dateTime="2024-02-24">24/02/2024</time>}
          icon={<CalendarDays className="w-4 h-4" />}
        />
        <InfoItem
          label="ผู้รับผิดชอบตัด"
          value="สมชาย ใจดี"
          icon={<User2 className="w-4 h-4" />}
        />
      </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* ซ้าย: ข้อมูลเหล็ก (คำนวณ) */}
                  <SteelTable
                    status={jobOrder.status}
                    rows={jobOrder.steel.map((s) => ({
                      steelType: s.steelType,
                      weight: s.weight,
                      price: s.price,
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Tabs Card */}
            <div className="rounded-2xl border border-gray-200 bg-background shadow-sm px-2 py-2">
              {/* Tabs Header */}
              <Tabs defaultValue="StaffInfo" className="w-full">
                {/* mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12 */}
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  <TabsTrigger
                    value="StaffInfo"
                    className="data-[state=active]:text-white"
                  >
                    StaffInfo
                  </TabsTrigger>
                  <TabsTrigger
                    value="customer"
                    className="data-[state=active]:text-white"
                  >
                    Customer
                  </TabsTrigger>
                  <TabsTrigger
                    value="production"
                    className="data-[state=active]:text-white"
                  >
                    Production
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="data-[state=active]:text-white"
                  >
                    Delivery
                  </TabsTrigger>
                </TabsList>

                {/* Specifications */}
                <TabsContent value="StaffInfo">
                  <StaffInfoCard
                    supervisorName={["สมชาย รักดี", "สมศรี สวยงาม"]}
                    technicians={[
                      "สมหมาย ใจดี",
                      "สมศักดิ์ แก่นทอง",
                      "สมปอง มีสุข",
                      "วรเมธ โพธิ์ทอง",
                    ]}
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
