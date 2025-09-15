"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Building2,
  Package,
  Ruler,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Edit,
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  Scissors,
  Truck,
} from "lucide-react";

const JobOrderDetailPage = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchJobOrder = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);
    };

    fetchJobOrder();
  }, []);
  const router = useRouter();

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
                {" "}
                รายละเอียดออเดอร์{" "}
              </h1>
              <p className="text-sm text-muted-foreground">
                {" "}
                รายละเอียดออเดอร์แบบครบถ้วน{" "}
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
          <section className="xl:col-span-8 space-y-6">
            {/* Order Overview Card */}
            <div className="rounded-2xl border border-gray-200">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    ภาพรวมออเดอร์
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    เลขที่ใบ PO : PO-2024-001
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    กำลังตัด
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    ด่วน
                  </span>
                </div>
              </div>

              {/* Two column info */}
              <div className="grid grid-cols-1 gap-4 border-t px-5 py-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="mb-3 text-sm font-bold text-foreground">
                    ข้อมูลออเดอร์
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-foreground">Order ID :</dt>
                    <dd className="font-medium">001</dd>
                    <dt className="text-foreground">สร้างออเดอร์เมื่อ :</dt>
                    <dd className="font-medium">1/15/2024, 9:30:16 AM</dd>
                    <dt className="text-foreground">วันที่ต้องจัดส่ง :</dt>
                    <dd className="font-medium">2/24/2024</dd>
                    <dt className="text-foreground">ผู้รับผิดชอบตัด :</dt>
                    <dd className="font-medium">สมชาย ใจดี</dd>
                  </dl>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <h3 className="mb-3 text-sm font-bold text-foreground">
                    ข้อมูลราคา
                  </h3>
                  <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-foreground">น้ำหนักที่คำนวนไว้ :</dt>
                    <dd className="font-medium">240 kg</dd>
                    <dt className="text-foreground">น้ำหนักจริงที่วัดได้:</dt>
                    <dd className="font-medium">245.5 kg</dd>
                    <dt className="text-foreground">ราคาที่คำนวนได้:</dt>
                    <dd className="font-semibold text-green-700">$2450.00</dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* Tabs Card */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-2 py-2">
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
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Steel Specs */}
                      <div className="rounded-xl border border-gray-100 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          <h4 className="text-sm font-semibold">
                            
                            Steel Specifications
                          </h4>
                        </div>
                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                          <dt className="text-gray-500">Steel Type:</dt>
                          <dd className="font-medium">Carbon Steel</dd>
                          <dt className="text-gray-500">Quantity:</dt>
                          <dd className="font-medium">50 pieces</dd>
                          <dt className="text-gray-500">Width:</dt>
                          <dd className="font-medium">100 mm</dd>
                          <dt className="text-gray-500">Length:</dt>
                          <dd className="font-medium">2000 mm</dd>
                          <dt className="text-gray-500">Thickness:</dt>
                          <dd className="font-medium">5 mm</dd>
                        </dl>
                      </div>

                      {/* Actual Dimensions */}
                      <div className="rounded-xl border border-gray-100 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <h4 className="text-sm font-semibold">
                            Actual Dimensions
                          </h4>
                        </div>
                        <dl className="grid grid-cols-2 gap-y-2 text-sm">
                          <dt className="text-gray-500">Actual Width:</dt>
                          <dd className="font-medium">99.8 mm</dd>
                          <dt className="text-gray-500">Actual Length:</dt>
                          <dd className="font-medium">199.9 mm</dd>
                          <dt className="text-gray-500">Actual Thickness:</dt>
                          <dd className="font-medium">5 mm</dd>
                        </dl>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-gray-100 p-4">
                      <h4 className="mb-2 text-sm font-semibold">
                        Special Instructions
                      </h4>
                      <p className="text-sm text-gray-600">
                        Handle with care – precision cutting required for
                        automotive parts. Ensure smooth edges.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Customer */}
                <TabsContent value="customer">
                  <div className="px-5 py-4 space-y-4">
                    <div className="rounded-xl border border-gray-100 p-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          รายละเอียดลูกค้า
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">บริษัท จำกัด</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">arm1532arm@gmail.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">0655389857</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          ที่อยู่จัดส่ง
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          ตำบล บางรัก อำเภอ เมือง จังหวัด กรุงเทพ 10500
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Production */}
                <TabsContent value="production">
                  <div className="px-5 py-4 space-y-4">
                    <div className="rounded-xl border border-gray-100 p-4">
                    <h4 className="text-sm font-semibold">Production Status</h4>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Cutting started on 1/20/2024</li>
                      <li>🔄 In progress – estimated finish 1/25/2024</li>
                      <li>👷 Assigned Cutter: John Smith</li>
                    </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Delivery */}
                <TabsContent value="delivery">
                  <div className="px-5 py-4 space-y-4">
                    <div className="rounded-xl border border-gray-100 p-4">
                    <h4 className="text-sm font-semibold">Delivery Details</h4>
                    <dl className="grid grid-cols-2 gap-y-2 text-sm">
                      <dt className="text-gray-500">Delivery Date:</dt>
                      <dd className="font-medium">2/24/2024</dd>
                      <dt className="text-gray-500">Delivery Method:</dt>
                      <dd className="font-medium">Truck</dd>
                      <dt className="text-gray-500">Driver:</dt>
                      <dd className="font-medium">Mr. Anan</dd>
                      <dt className="text-gray-500">Status:</dt>
                      <dd className="font-medium">Pending Dispatch</dd>
                    </dl>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Tab body: Specifications */}

            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="xl:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                {[
                  "Edit Order",
                  "Print Summary",
                  "Email Customer",
                  "Generate Invoice",
                ].map((x) => (
                  <button
                    key={x}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span>{x}</span>
                    <span className="text-gray-400">›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile bottom actions */}
      {/* <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-3 px-4 py-2 text-center text-xs">
          {["Print", "PDF", "Edit"].map((x, i) => (
            <button
              key={x}
              className={`rounded-xl px-3 py-2 ${
                i === 2 ? "bg-gray-900 text-white" : ""
              }`}
            >
              {x}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default JobOrderDetailPage;

/*
const JobOrderDetails = () => {
  const { id } = 1;
  const router = useRouter();
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchJobOrder = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setJobOrder(mockJobOrder);
      setLoading(false);
    };

    fetchJobOrder();
  }, [id]);

  const getStatusColor = (status: JobOrder['status']) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "cutting": return "bg-primary text-primary-foreground";
      case "weighing": return "bg-steel text-foreground";
      case "ready": return "bg-success text-success-foreground";
      case "shipped": return "bg-primary text-primary-foreground";
      case "completed": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: JobOrder['priority']) => {
    switch (priority) {
      case "urgent": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-warning text-warning-foreground";
      case "normal": return "bg-primary text-primary-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusProgress = (status: JobOrder['status']) => {
    switch (status) {
      case "pending": return 10;
      case "cutting": return 40;
      case "weighing": return 70;
      case "ready": return 85;
      case "shipped": return 95;
      case "completed": return 100;
      default: return 0;
    }
  };

  const handleStatusUpdate = (newStatus: JobOrder['status']) => {
    if (jobOrder) {
      setJobOrder({ ...jobOrder, status: newStatus });
      toast({
        title: "Status Updated",
        description: `Job order status changed to ${newStatus.toUpperCase()}`,
      });
    }
  };

  const handlePrint = () => {
    toast({
      title: "Printing Job Order",
      description: "Job order details sent to printer",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Downloading PDF",
      description: "Job order PDF downloaded successfully",
    });
  };

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

  
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Job Order Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested job order could not be found.</p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  

  return (
    <div className="min-h-screen md:pl-24 ">
      <div className="container mx-auto p-6">
        
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  Job Order Details
                </h1>
              </div>
              <p className="text-muted-foreground">
                Comprehensive view of job order {jobOrder.id}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="steel" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          
          <div className="lg:col-span-2 space-y-6">
            
            
            <Card className="shadow-steel">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Order Overview
                    </CardTitle>
                    <CardDescription>
                      Purchase Order: {jobOrder.poNumber}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(jobOrder.status)}>
                      {jobOrder.status.toUpperCase()}
                    </Badge>
                    <Badge className={getPriorityColor(jobOrder.priority)}>
                      {jobOrder.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Progress Status</h4>
                    <Progress value={getStatusProgress(jobOrder.status)} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {getStatusProgress(jobOrder.status)}% Complete
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order ID:</span>
                          <span className="font-medium">{jobOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{jobOrder.createdAt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Date:</span>
                          <span className="font-medium">{jobOrder.deliveryDate || "Not specified"}</span>
                        </div>
                        {jobOrder.assignedCutter && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned Cutter:</span>
                            <span className="font-medium">{jobOrder.assignedCutter}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Pricing Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Weight:</span>
                          <span className="font-medium">{jobOrder.estimatedWeight} kg</span>
                        </div>
                        {jobOrder.weight && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actual Weight:</span>
                            <span className="font-medium">{jobOrder.weight} kg</span>
                          </div>
                        )}
                        {jobOrder.price && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Price:</span>
                            <span className="font-bold text-lg">${jobOrder.price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            
            <Card className="shadow-steel">
              <Tabs defaultValue="specifications" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="specifications">Specifications</TabsTrigger>
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="production">Production</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent>
                  <TabsContent value="specifications" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          Steel Specifications
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Steel Type:</span>
                            <span className="font-medium">{jobOrder.steelType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{jobOrder.quantity} pieces</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Width:</span>
                            <span className="font-medium">{jobOrder.width} mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Length:</span>
                            <span className="font-medium">{jobOrder.length} mm</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Thickness:</span>
                            <span className="font-medium">{jobOrder.thickness} mm</span>
                          </div>
                        </div>
                      </div>

                      {jobOrder.actualDimensions && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            Actual Dimensions
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Actual Width:</span>
                              <span className="font-medium">{jobOrder.actualDimensions.width} mm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Actual Length:</span>
                              <span className="font-medium">{jobOrder.actualDimensions.length} mm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Actual Thickness:</span>
                              <span className="font-medium">{jobOrder.actualDimensions.thickness} mm</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {jobOrder.specialInstructions && (
                      <div>
                        <h4 className="font-semibold mb-2">Special Instructions</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {jobOrder.specialInstructions}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="customer" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Customer Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{jobOrder.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{jobOrder.customerEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{jobOrder.customerPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {jobOrder.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="production" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Scissors className="h-4 w-4" />
                          Production Status
                        </h4>
                        <Badge className={getStatusColor(jobOrder.status)}>
                          {jobOrder.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                          variant={jobOrder.status === "cutting" ? "default" : "outline"}
                          onClick={() => handleStatusUpdate("cutting")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Start Cutting
                        </Button>
                        <Button
                          variant={jobOrder.status === "weighing" ? "default" : "outline"}
                          onClick={() => handleStatusUpdate("weighing")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Mark for Weighing
                        </Button>
                        <Button
                          variant={jobOrder.status === "ready" ? "default" : "outline"}
                          onClick={() => handleStatusUpdate("ready")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Mark Ready
                        </Button>
                      </div>

                      {jobOrder.assignedCutter && (
                        <div className="bg-muted p-4 rounded-lg">
                          <h5 className="font-medium mb-2">Assigned Cutter</h5>
                          <p className="text-sm text-muted-foreground">{jobOrder.assignedCutter}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="delivery" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Information
                        </h4>
                        {jobOrder.deliveryDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{jobOrder.deliveryDate}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant={jobOrder.status === "shipped" ? "default" : "outline"}
                          onClick={() => handleStatusUpdate("shipped")}
                          disabled={jobOrder.status !== "ready"}
                        >
                          Mark as Shipped
                        </Button>
                        <Button
                          variant={jobOrder.status === "completed" ? "success" : "outline"}
                          onClick={() => handleStatusUpdate("completed")}
                          disabled={jobOrder.status !== "shipped"}
                        >
                          Mark as Delivered
                        </Button>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Delivery Address</h5>
                        <p className="text-sm text-muted-foreground">{jobOrder.deliveryAddress}</p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          
          <div className="space-y-6">
            
           
            <Card className="shadow-steel">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Order
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Summary
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Customer
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>

            
            <Card className="shadow-steel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-success rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-xs text-muted-foreground">
                        {jobOrder.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cutting Started</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned to {jobOrder.assignedCutter}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Awaiting Completion</p>
                      <p className="text-xs text-muted-foreground">
                        In progress...
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};


*/
