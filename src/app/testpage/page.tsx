"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Progress } from "../../components/ui/progress";
import { toast } from "../../hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Building2,
  Package,
  Ruler,
  Weight,
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

const JobOrderDetails = () => {
  const id = "JO-001"; // In real scenario, this would come from route params
  const router = useRouter();
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchJobOrder = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setJobOrder(mockJobOrder);
      setLoading(false);
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

  const getPriorityColor = (priority: JobOrder["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "normal":
        return "bg-primary text-primary-foreground";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusProgress = (status: JobOrder["status"]) => {
    switch (status) {
      case "pending":
        return 10;
      case "cutting":
        return 40;
      case "weighing":
        return 70;
      case "ready":
        return 85;
      case "shipped":
        return 95;
      case "completed":
        return 100;
      default:
        return 0;
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

  if (!jobOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Job Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested job order could not be found.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-steel/20 pl-24">
      <div className="container mx-auto p-6">
        {/* Header */}
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Overview */}
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
                    <Progress
                      value={getStatusProgress(jobOrder.status)}
                      className="mb-2"
                    />
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
                          <span className="text-muted-foreground">
                            Order ID:
                          </span>
                          <span className="font-medium">{jobOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Created:
                          </span>
                          <span className="font-medium">
                            {jobOrder.createdAt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Delivery Date:
                          </span>
                          <span className="font-medium">
                            {jobOrder.deliveryDate || "Not specified"}
                          </span>
                        </div>
                        {jobOrder.assignedCutter && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Assigned Cutter:
                            </span>
                            <span className="font-medium">
                              {jobOrder.assignedCutter}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">
                        Pricing Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Estimated Weight:
                          </span>
                          <span className="font-medium">
                            {jobOrder.estimatedWeight} kg
                          </span>
                        </div>
                        {jobOrder.weight && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Actual Weight:
                            </span>
                            <span className="font-medium">
                              {jobOrder.weight} kg
                            </span>
                          </div>
                        )}
                        {jobOrder.price && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Price:
                            </span>
                            <span className="font-bold text-lg">
                              ${jobOrder.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Tabs */}
            <Card className="shadow-steel">
              <Tabs defaultValue="specifications" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="specifications">
                      Specifications
                    </TabsTrigger>
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
                            <span className="text-muted-foreground">
                              Steel Type:
                            </span>
                            <span className="font-medium">
                              {jobOrder.steelType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Quantity:
                            </span>
                            <span className="font-medium">
                              {jobOrder.quantity} pieces
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Width:
                            </span>
                            <span className="font-medium">
                              {jobOrder.width} mm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Length:
                            </span>
                            <span className="font-medium">
                              {jobOrder.length} mm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Thickness:
                            </span>
                            <span className="font-medium">
                              {jobOrder.thickness} mm
                            </span>
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
                              <span className="text-muted-foreground">
                                Actual Width:
                              </span>
                              <span className="font-medium">
                                {jobOrder.actualDimensions.width} mm
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Actual Length:
                              </span>
                              <span className="font-medium">
                                {jobOrder.actualDimensions.length} mm
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Actual Thickness:
                              </span>
                              <span className="font-medium">
                                {jobOrder.actualDimensions.thickness} mm
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {jobOrder.specialInstructions && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          Special Instructions
                        </h4>
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
                            <span className="font-medium">
                              {jobOrder.customerName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {jobOrder.customerEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {jobOrder.customerPhone}
                            </span>
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
                          variant={
                            jobOrder.status === "cutting"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleStatusUpdate("cutting")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Start Cutting
                        </Button>
                        <Button
                          variant={
                            jobOrder.status === "weighing"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleStatusUpdate("weighing")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Mark for Weighing
                        </Button>
                        <Button
                          variant={
                            jobOrder.status === "ready" ? "default" : "outline"
                          }
                          onClick={() => handleStatusUpdate("ready")}
                          disabled={jobOrder.status === "completed"}
                        >
                          Mark Ready
                        </Button>
                      </div>

                      {jobOrder.assignedCutter && (
                        <div className="bg-muted p-4 rounded-lg">
                          <h5 className="font-medium mb-2">Assigned Cutter</h5>
                          <p className="text-sm text-muted-foreground">
                            {jobOrder.assignedCutter}
                          </p>
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
                            <span className="text-sm">
                              {jobOrder.deliveryDate}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant={
                            jobOrder.status === "shipped"
                              ? "default"
                              : "outline"
                          }
                          onClick={() => handleStatusUpdate("shipped")}
                          disabled={jobOrder.status !== "ready"}
                        >
                          Mark as Shipped
                        </Button>
                        <Button
                          variant={
                            jobOrder.status === "completed"
                              ? "success"
                              : "outline"
                          }
                          onClick={() => handleStatusUpdate("completed")}
                          disabled={jobOrder.status !== "shipped"}
                        >
                          Mark as Delivered
                        </Button>
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Delivery Address</h5>
                        <p className="text-sm text-muted-foreground">
                          {jobOrder.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
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

            {/* Activity Timeline */}
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
                      <p className="text-sm font-medium text-muted-foreground">
                        Awaiting Completion
                      </p>
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

export default JobOrderDetails;
