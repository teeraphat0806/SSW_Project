'use client';
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  FileText, 
  Users, 
  Scissors, 
  Truck, 
  DollarSign, 
  Clock,
  Package,
  CheckCircle,
  Plus
} from "lucide-react";

type UserRole = "clerk" | "supervisor" | "cutter" | "delivery";

interface JobOrder {
  id: string;
  poNumber: string;
  customerName: string;
  steelType: string;
  quantity: number;
  width: number;
  length: number;
  thickness: number;
  status: "pending" | "cutting" | "weighing" | "ready" | "shipped" | "completed";
  weight?: number;
  price?: number;
  createdAt: Date;
}

const mockJobOrders: JobOrder[] = [
  {
    id: "JO-001",
    poNumber: "PO-2024-001",
    customerName: "ABC Manufacturing",
    steelType: "Carbon Steel",
    quantity: 50,
    width: 100,
    length: 200,
    thickness: 5,
    status: "pending",
    createdAt: new Date("2024-01-15")
  },
  {
    id: "JO-002", 
    poNumber: "PO-2024-002",
    customerName: "XYZ Industries",
    steelType: "Stainless Steel",
    quantity: 25,
    width: 150,
    length: 300,
    thickness: 8,
    status: "cutting",
    createdAt: new Date("2024-01-14")
  },
  {
    id: "JO-003",
    poNumber: "PO-2024-003", 
    customerName: "Steel Works Ltd",
    steelType: "Aluminum",
    quantity: 100,
    width: 75,
    length: 150,
    thickness: 3,
    status: "weighing",
    weight: 245.5,
    createdAt: new Date("2024-01-13")
  }
];

const Dashboard = ({role}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(role=='superadmin'?'Supervisor':role || "clerk");
  const [jobOrders] = useState<JobOrder[]>(mockJobOrders);
  const router = useRouter();
  const getStatusColor = (status: JobOrder['status']) => {
    switch (status) {
      case "pending": return "bg-yellow-300 text-black";
      case "cutting": return "bg-blue-500 text-white";
      case "weighing": return "bg-blue-500 text-white";
      case "ready": return "bg-green-500 text-white";
      case "shipped": return "bg-blue-500 text-white";
      case "completed": return "bg-green-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  const getStatsForRole = () => {
    const stats = {
      clerk: [
        { label: "รายการปัจจุบัน", value: jobOrders.filter(jo => jo.status === "pending" ).length, icon: FileText, color:"bg-blue-500" },
        { label: "พร้อมแจ้งชำระ", value: jobOrders.filter(jo => jo.status === "ready").length, icon: DollarSign, color:"bg-red-500" },
        { label: "รายการทั้งหมด", value: jobOrders.length, icon: Package, color:"bg-blue-500" },
        { label: "รายการสำเร็จ", value: jobOrders.filter(jo => jo.status === "completed").length, icon: CheckCircle, color:"bg-blue-500" }
      ],
      supervisor: [
        { label: "รายการ ในคิว", value: jobOrders.filter(jo => jo.status === "pending").length, icon: Clock, color:"bg-blue-500" },
        { label: "กำลังตัด", value: jobOrders.filter(jo => jo.status === "cutting").length, icon: Scissors, color:"bg-red-500" },
        { label: "พร้อมตัด", value: 3, icon: Users, color:"bg-blue-500" },
        { label: "รายการทั้งหมด", value: 15, icon: Package, color:"bg-blue-500" }
      ],
      cutter: [
        { label: "รายการวันนี้", value: jobOrders.filter(jo => jo.status === "cutting").length, icon: Scissors, color:"bg-blue-500" },
        { label: "รายการสำเร็จ", value: 5, icon: CheckCircle, color:"bg-blue-500" },
        { label: "รายการ กำลังตัด", value: 3, icon: Clock, color:"bg-red-500" },
        { label: "ตัดแล้วกี่ชิ้น", value: 127, icon: Package, color:"bg-blue-500" }
      ],
      delivery: [
        { label: "พร้อมจัดส่ง", value: jobOrders.filter(jo => jo.status === "ready").length, icon: Package, color:"bg-blue-500" },
        { label: "กำลังจัดส่ง", value: jobOrders.filter(jo => jo.status === "shipped").length, icon: Truck, color:"bg-red-500" },
        { label: "จัดส่งวันนี้", value: 2, icon: CheckCircle, color:"bg-blue-500" },
        { label: "สินค้ารอรับ", value: 1, icon: Clock, color:"bg-blue-500" }
      ]
    };
    return stats[currentRole];
  };

  const getRoleDisplayName = (role: UserRole) => {
    const names = {
      clerk: "Office Clerk",
      supervisor: "Production Supervisor", 
      cutter: "Steel Cutter",
      delivery: "Delivery Staff"
    };
    return names[role];
  };
  useEffect(()=> {
    if (role === 'superadmin') {
      setCurrentRole('supervisor');
    }
    else if (role == ''){
      setCurrentRole('clerk');
    }
  }, [role,]);
  return (
    <div className="min-h-screen ">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">
                ระบบจัดการงานตัดเหล็ก by {role} 
              </h1>
              <p className="text-muted-foreground">
                ยินดีต้อนรับสู่ระบบจัดการงานตัดเหล็กของเรา! เลือกบทบาทของคุณเพื่อดูข้อมูลที่เกี่ยวข้อง
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Create Button */}
                <Button variant="steel" size="lg" className="shadow-elevation" onClick={() => router.push('/new-job-order')}>
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง รายการใหม่
                </Button>
              
              {/* <div className="flex items-center gap-2"> */}
                {/* <span className="text-sm text-muted-foreground">Role:</span> */}
                {/* <Tabs value={currentRole} onValueChange={(value) => setCurrentRole(value as UserRole)}> */}
                  {/* <TabsList className="bg-card shadow-steel"> */}
                    {/* <TabsTrigger value="clerk">Clerk</TabsTrigger> */}
                    {/* <TabsTrigger value="supervisor">Supervisor</TabsTrigger> */}
                    {/* <TabsTrigger value="cutter">Cutter</TabsTrigger> */}
                    {/* <TabsTrigger value="delivery">Delivery</TabsTrigger> */}
                  {/* </TabsList> */}
                {/* </Tabs> */}
              {/* </div> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatsForRole().map((stat, index) => (
            <Card key={index} className={`shadow-steel border-none hover:shadow-elevation transition-shadow ${stat.color}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-white" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Job Orders List */}
          <div className="lg:col-span-2">
            <Card className="shadow-steel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Job Orders - {getRoleDisplayName(currentRole)} View
                </CardTitle>
                <CardDescription>
                  รายการงานตัดเหล็กทั้งหมดที่คุณสามารถจัดการได้
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-blue-500">{order.poNumber}</h3>
                          <p className="text-sm text-black">{order.customerName}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">ชนิดเหล็ก:</span>
                          <p className="font-medium">{order.steelType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">จำนวน:</span>
                          <p className="font-medium">{order.quantity} ชิ้น</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ขนาด:</span>
                          <p className="font-medium">{order.width}×{order.length}×{order.thickness}mm</p>
                        </div>
                        {order.weight && (
                          <div>
                            <span className="text-muted-foreground">น้ำหนัก:</span>
                            <p className="font-medium">{order.weight} kg</p>
                          </div>
                        )}
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          สร้างเมื่อ: {order.createdAt.toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {currentRole === "clerk" && (
                            <>
                              <Button size="sm" className="bg-blue-500 text-white border-none hover:bg-blue-600 hover:scale-110 hover:cursor-pointer transition-all" variant="outline" onClick={() => router.push(`/job-order/${order.id}`)}>รายละเอียด</Button>
                              <Button size="sm" className="border-1 border-black hover:cursor-pointer hover:scale-110 transition-all ">สรุปรายการ</Button>
                            </>
                          )}
                          {currentRole === "supervisor" && (
                            <>
                              <Button size="sm" onClick={() => router.push("/production")}>รายละเอียดสินค้า</Button>
                              <Button size="sm">ส่ง ตัด</Button>
                            </>
                          )}
                          {currentRole === "cutter" && order.status === "cutting" && (
                            <Button size="sm">ดำเนินการสำเร็จ</Button>
                          )}
                          {currentRole === "delivery" && order.status === "ready" && (
                            <Button size="sm">เตรียม จัดส่ง</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Status */}
          <div>
            <Card className="shadow-steel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  สถานะ รายการ
                </CardTitle>
                <CardDescription>
                  ปริมาณงานในแต่ละขั้นตอนการผลิต
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: "pending", label: "รายการปัจจุบัน", count: jobOrders.filter(jo => jo.status === "pending").length },
                    { status: "cutting", label: "กำลังตัด", count: jobOrders.filter(jo => jo.status === "cutting").length },
                    { status: "weighing", label: "ชั่งน้ำหนัก", count: jobOrders.filter(jo => jo.status === "weighing").length },
                    { status: "ready", label: "พร้อมจัดส่งสินค้า", count: jobOrders.filter(jo => jo.status === "ready").length },
                    { status: "shipped", label: "กำลังจัดส่งสินค้า", count: jobOrders.filter(jo => jo.status === "shipped").length },
                    { status: "completed", label: "สำเร็จ", count: jobOrders.filter(jo => jo.status === "completed").length }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-steel mt-6">
              <CardHeader>
                <CardTitle>เมนู</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentRole === "clerk" && (
                    <>
                        <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all"  onClick={() => router.push('/new-job-order')}>
                          <FileText className="mr-2 h-4 w-4 " />
                          สร้าง รายการใหม่
                        </Button>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all" >
                        <DollarSign className="mr-2 h-4 w-4" />
                        สร้าง ใบแจ้งหนี้
                      </Button>
                    </>
                  )}
                  {currentRole === "supervisor" && (
                    <>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all" >
                        <Users className="mr-2 h-4 w-4" />
                        Manage Cutters
                      </Button>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all" >
                        <Scissors className="mr-2 h-4 w-4" />
                        Production Report
                      </Button>
                    </>
                  )}
                  {currentRole === "cutter" && (
                    <>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all" >
                        <Clock className="mr-2 h-4 w-4" />
                        Clock In/Out
                      </Button>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all">
                        <Package className="mr-2 h-4 w-4" />
                        Record Weight
                      </Button>
                    </>
                  )}
                  {currentRole === "delivery" && (
                    <>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all">
                        <Truck className="mr-2 h-4 w-4" />
                        Schedule Delivery
                      </Button>
                      <Button className="w-full justify-start border-1 border-black hover:cursor-pointer hover:scale-110 transition-all" >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Delivery Report
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;