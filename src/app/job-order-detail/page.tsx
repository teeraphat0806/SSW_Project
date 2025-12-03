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
  CalendarDays,
  User2,
  Hash,
  Printer,
  Edit,
  Building2,
  Factory,
  Truck,
} from "lucide-react";
import { QuickAction } from "../../components/jobordertail/QuickAction";
import { StaffInfoCard } from "../../components/jobordertail/StaffInfoCard";
import { CustomerTab } from "../../components/jobordertail/CustomerTab";
import { ProductionTab } from "../../components/jobordertail/ProductionTab";
import { DeliveryTab } from "../../components/jobordertail/DeliveryTab";
// Consolidate Card imports to use the local UI component for consistent styling
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

// type InfoItemProps = {
//   label: string;
//   value: React.ReactNode;
//   icon: React.ReactNode;
// };

// const InfoItem = ({ label, value, icon }: InfoItemProps) => {
//   return (
//     <div className="flex items-start gap-3">
//       {/* icon */}
//       <div className="mt-0.5 flex h-6 w-6 items-center justify-center text-muted-foreground">
//         {icon}
//       </div>
//       {/* text */}
//       <div className="space-y-0.5">
//         <div className="text-xs font-medium text-muted-foreground tracking-wide">
//           {label}
//         </div>
//         <div className="text-sm font-semibold text-foreground">{value}</div>
//       </div>
//     </div>
//   );
// };

const InfoStat = ({ label, value, icon: Icon }) => (
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
            <span>แก้ไขล่าสุดเมื่อ: 12/2/2025</span>
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
                  รายละเอียดออเดอร์ #{jobOrder.id}
                </h1>
                <Badge
                  variant="outline"
                  className={getStatusColor(jobOrder.status)}
                >
                  {jobOrder.status.toUpperCase()}
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
                {jobOrder.poNumber}
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
                    value={`#${jobOrder.id}`}
                    icon={Hash}
                  />
                  <InfoStat
                    label="เลขที่ใบสั่งซื้อ (PO)"
                    value={jobOrder.poNumber}
                    icon={FileText}
                  />
                  <InfoStat
                    label="กำหนดส่งสินค้า"
                    value="24 ก.พ. 2024"
                    icon={CalendarDays}
                  />
                  <InfoStat
                    label="ผู้รับผิดชอบ (ตัด)"
                    value="สมชาย ใจดี"
                    icon={User2}
                  />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-lg shadow-md ">
              <CardHeader className="bg-background border-b px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    รายการคำนวณเหล็ก
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full text-sm text-left">
                  <div className="bg-background px-6 py-3 font-medium text-muted-foreground grid grid-cols-3">
                    <span className="font-bold">ประเภทเหล็ก</span>
                    <span className="font-bold">น้ำหนัก (Kg)</span>
                    <span className="text-right font-bold">ราคาประเมิน</span>
                  </div>
                  {jobOrder.steel.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 border-b last:border-0 grid grid-cols-3 bg-background  items-center hover:bg-hover transition-colors"
                    >
                      <span className="font-medium">{item.steelType}</span>
                      <span className="text-muted-foreground">
                        {item.weight}
                      </span>
                      <span className="text-right font-mono">
                        {Number(item.price).toLocaleString("th-TH")}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-background">
                    <span className="px-6 py-4 font-semibold">รวมทั้งหมด</span>
                    <span className="px-6 py-4 font-semibold text-green-400">
                      {jobOrder.steel
                        .reduce((sum, item) => sum + item.price, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                <TabsContent value="Customer" className="mt-1">
                  <CustomerTab
                    customer={{
                      name: "บริษัท จำกัด",
                      email: "arm1532arm@gmail.com",
                      code: "213254",
                      phone: "0655389857",
                      shippingAddress:
                        "ตำบล บางรัก อำเภอ เมือง จังหวัด กรุงเทพ 10500",
                    }}
                  />
                </TabsContent>

                {/* Production */}
                <TabsContent value="Production" className="mt-2">
                  <ProductionTab
                    status={jobOrder.status}
                    assignedCutter={jobOrder.assignedCutter}
                    onUpdateStatus={handleStatusUpdate}
                    getStatusColor={getStatusColor}
                  />
                </TabsContent>

                {/* Delivery */}
                <TabsContent value="Delivery" className="mt-0">
                  <DeliveryTab
                    status={jobOrder.status}
                    deliveryDate={jobOrder.deliveryDate}
                    deliveryAddress={jobOrder.deliveryAddress}
                    onUpdateStatus={handleStatusUpdate}
                    className=""
                    items={jobOrder.steelActual}
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
    </>
  );
};

export default JobOrderDetailPage;
