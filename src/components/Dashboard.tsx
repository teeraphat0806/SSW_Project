import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
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

const Dashboard = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>("clerk");
  const [jobOrders] = useState<JobOrder[]>(mockJobOrders);

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

  const getStatsForRole = () => {
    const stats = {
      clerk: [
        { label: "Pending Orders", value: jobOrders.filter(jo => jo.status === "pending").length, icon: FileText },
        { label: "Ready for Invoice", value: jobOrders.filter(jo => jo.status === "ready").length, icon: DollarSign },
        { label: "Total Orders", value: jobOrders.length, icon: Package },
        { label: "Completed Today", value: jobOrders.filter(jo => jo.status === "completed").length, icon: CheckCircle }
      ],
      supervisor: [
        { label: "Orders in Queue", value: jobOrders.filter(jo => jo.status === "pending").length, icon: Clock },
        { label: "Currently Cutting", value: jobOrders.filter(jo => jo.status === "cutting").length, icon: Scissors },
        { label: "Active Cutters", value: 3, icon: Users },
        { label: "Daily Target", value: 15, icon: Package }
      ],
      cutter: [
        { label: "My Tasks", value: jobOrders.filter(jo => jo.status === "cutting").length, icon: Scissors },
        { label: "Completed Today", value: 5, icon: CheckCircle },
        { label: "Pending Tasks", value: 3, icon: Clock },
        { label: "Total Pieces Cut", value: 127, icon: Package }
      ],
      delivery: [
        { label: "Ready to Ship", value: jobOrders.filter(jo => jo.status === "ready").length, icon: Package },
        { label: "Out for Delivery", value: jobOrders.filter(jo => jo.status === "shipped").length, icon: Truck },
        { label: "Delivered Today", value: 2, icon: CheckCircle },
        { label: "Pending Pickup", value: 1, icon: Clock }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-steel/20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Steel Cutting Management System
              </h1>
              <p className="text-muted-foreground">
                Streamlined workflow management for steel cutting operations
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Create Button */}
              <Link to="/new-job-order">
                <Button variant="steel" size="lg" className="shadow-elevation">
                  <Plus className="mr-2 h-4 w-4" />
                  New Job Order
                </Button>
              </Link>
              
              {/* Role Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Tabs value={currentRole} onValueChange={(value) => setCurrentRole(value as UserRole)}>
                  <TabsList className="bg-card shadow-steel">
                    <TabsTrigger value="clerk">Clerk</TabsTrigger>
                    <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
                    <TabsTrigger value="cutter">Cutter</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatsForRole().map((stat, index) => (
            <Card key={index} className="shadow-steel hover:shadow-elevation transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
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
                  <FileText className="h-5 w-5 text-primary" />
                  Job Orders - {getRoleDisplayName(currentRole)} View
                </CardTitle>
                <CardDescription>
                  Current job orders in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{order.poNumber}</h3>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Steel:</span>
                          <p className="font-medium">{order.steelType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qty:</span>
                          <p className="font-medium">{order.quantity} pcs</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dimensions:</span>
                          <p className="font-medium">{order.width}×{order.length}×{order.thickness}mm</p>
                        </div>
                        {order.weight && (
                          <div>
                            <span className="text-muted-foreground">Weight:</span>
                            <p className="font-medium">{order.weight} kg</p>
                          </div>
                        )}
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Created: {order.createdAt.toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {currentRole === "clerk" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/job-order/${order.id}`)}>View Details</Button>
                              <Button size="sm">Create Summary</Button>
                            </>
                          )}
                          {currentRole === "supervisor" && (
                            <>
                              <Button size="sm" onClick={() => navigate("/production")}>Production View</Button>
                              <Button size="sm">Assign Cutter</Button>
                            </>
                          )}
                          {currentRole === "cutter" && order.status === "cutting" && (
                            <Button size="sm">Mark Complete</Button>
                          )}
                          {currentRole === "delivery" && order.status === "ready" && (
                            <Button size="sm">Prepare Delivery</Button>
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
                  <Package className="h-5 w-5 text-primary" />
                  Workflow Status
                </CardTitle>
                <CardDescription>
                  Current workflow distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: "pending", label: "Pending Orders", count: jobOrders.filter(jo => jo.status === "pending").length },
                    { status: "cutting", label: "In Cutting", count: jobOrders.filter(jo => jo.status === "cutting").length },
                    { status: "weighing", label: "Weighing", count: jobOrders.filter(jo => jo.status === "weighing").length },
                    { status: "ready", label: "Ready to Ship", count: jobOrders.filter(jo => jo.status === "ready").length },
                    { status: "shipped", label: "Shipped", count: jobOrders.filter(jo => jo.status === "shipped").length },
                    { status: "completed", label: "Completed", count: jobOrders.filter(jo => jo.status === "completed").length }
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
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentRole === "clerk" && (
                    <>
                      <Link to="/new-job-order">
                        <Button className="w-full justify-start" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          New Job Order
                        </Button>
                      </Link>
                      <Button className="w-full justify-start" variant="outline">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Generate Invoice
                      </Button>
                    </>
                  )}
                  {currentRole === "supervisor" && (
                    <>
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Cutters
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Scissors className="mr-2 h-4 w-4" />
                        Production Report
                      </Button>
                    </>
                  )}
                  {currentRole === "cutter" && (
                    <>
                      <Button className="w-full justify-start" variant="outline">
                        <Clock className="mr-2 h-4 w-4" />
                        Clock In/Out
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Package className="mr-2 h-4 w-4" />
                        Record Weight
                      </Button>
                    </>
                  )}
                  {currentRole === "delivery" && (
                    <>
                      <Button className="w-full justify-start" variant="outline">
                        <Truck className="mr-2 h-4 w-4" />
                        Schedule Delivery
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
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