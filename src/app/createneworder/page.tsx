'use client';
import {  useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ToastContainer, toast } from 'react-toastify';
import "../globals.css";

import { 
  ArrowLeft, 
  FileText, 
  Building2, 
  Package, 
  Ruler, 
  Weight,
  Plus,
  Save,
  X
} from "lucide-react";

interface SteelItem {
  id: string;
  steelType: string;
  quantity: number;
  width: number;
  length: number;
  thickness: number;
  notes?: string;
}

const steelTypes = [
  "Carbon Steel",
  "Stainless Steel", 
  "Aluminum",
  "Galvanized Steel",
  "Cold Rolled Steel",
  "Hot Rolled Steel",
  "Mild Steel",
  "Tool Steel"
];

const NewJobOrder = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);


  
  // Form state
  const [formData, setFormData] = useState({
    poNumber: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    deliveryDate: "",
    specialInstructions: ""
  });

  const [steelItems, setSteelItems] = useState<SteelItem[]>([
    {
      id: "1",
      steelType: "",
      quantity: 1,
      width: 0,
      length: 0,
      thickness: 0,
      notes: ""
    }
  ]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSteelItem = (id: string, field: string, value: any) => {
    setSteelItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addSteelItem = () => {
    const newItem: SteelItem = {
      id: Date.now().toString(),
      steelType: "",
      quantity: 1,
      width: 0,
      length: 0,
      thickness: 0,
      notes: ""
    };
    setSteelItems(prev => [...prev, newItem]);
  };

  const removeSteelItem = (id: string) => {
    if (steelItems.length > 1) {
      setSteelItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const validateForm = () => {
    if (!formData.poNumber.trim()) return "Purchase Order Number is required";
    if (!formData.customerName.trim()) return "Customer Name is required";
    
    for (let item of steelItems) {
      if (!item.steelType) return "Steel Type is required for all items";
      if (item.quantity <= 0) return "Quantity must be greater than 0";
      if (item.width <= 0) return "Width must be greater than 0";
      if (item.length <= 0) return "Length must be greater than 0";
      if (item.thickness <= 0) return "Thickness must be greater than 0";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
              position: 'bottom-right',
              });

     
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const jobOrder = {
        id: `JO-${Date.now()}`,
        ...formData,
        steelItems,
        status: "pending",
        createdAt: new Date(),
        totalItems: steelItems.reduce((sum, item) => sum + item.quantity, 0)
      };

      console.log("New Job Order:", jobOrder);
      toast.success('สร้างออเดอร์สำเร็จ', {
              position: 'bottom-right',
              });
      

      // Navigate back to dashboard
      router.push("/dashboard");
      
    } catch (error) {
      toast.error(`ขออภัย มีข้อผิดพลาด: ${validationError}`, {
              position: 'bottom-right',
              });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-warning text-warning-foreground";
      case "normal": return "bg-primary text-primary-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen pl-24 ">
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
          
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Create New Job Order
            </h1>
          </div>
          <p className="text-muted-foreground">
            Enter the details for a new steel cutting job order
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-steel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    Enter customer and order details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="poNumber">Purchase Order Number *</Label>
                      <Input
                        id="poNumber"
                        value={formData.poNumber}
                        onChange={(e) => updateFormData("poNumber", e.target.value)}
                        placeholder="PO-2024-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => updateFormData("customerName", e.target.value)}
                        placeholder="ABC Manufacturing Ltd."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerEmail">Customer Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => updateFormData("customerEmail", e.target.value)}
                        placeholder="contact@abc-manufacturing.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Customer Phone</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => updateFormData("customerPhone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={(e) => updateFormData("deliveryAddress", e.target.value)}
                      placeholder="123 Industrial Ave, Manufacturing District, City, State 12345"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => updateFormData("priority", value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="normal">Normal Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="deliveryDate">Requested Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => updateFormData("deliveryDate", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialInstructions">Special Instructions</Label>
                    <Textarea
                      id="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={(e) => updateFormData("specialInstructions", e.target.value)}
                      placeholder="Any special cutting requirements, handling instructions, or delivery notes..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Steel Items */}
              <Card className="shadow-steel">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Steel Items to Cut
                      </CardTitle>
                      <CardDescription>
                        Specify the steel types and dimensions for cutting
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={addSteelItem}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {steelItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4 ">
                        <h4 className="font-semibold text-foreground">
                          Item #{index + 1}
                        </h4>
                        {steelItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSteelItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2 lg:col-span-1">
                          <Label>Steel Type *</Label>
                          <Select
                            value={item.steelType}
                            onValueChange={(value) => updateSteelItem(item.id, "steelType", value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select steel type" />
                            </SelectTrigger>
                            <SelectContent>
                              {steelTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Quantity (pieces) *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateSteelItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Width (mm) *
                          </Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.width}
                            onChange={(e) => updateSteelItem(item.id, "width", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Length (mm) *
                          </Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.length}
                            onChange={(e) => updateSteelItem(item.id, "length", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="flex items-center gap-2">
                            <Weight className="h-4 w-4" />
                            Thickness (mm) *
                          </Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.thickness}
                            onChange={(e) => updateSteelItem(item.id, "thickness", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Item Notes</Label>
                        <Textarea
                          value={item.notes || ""}
                          onChange={(e) => updateSteelItem(item.id, "notes", e.target.value)}
                          placeholder="Specific cutting instructions for this item..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="shadow-steel">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">
                        {steelItems.reduce((sum, item) => sum + item.quantity, 0)} pieces
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Steel Types:</span>
                      <span className="font-medium">
                        {new Set(steelItems.filter(item => item.steelType).map(item => item.steelType)).size}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge className={getPriorityColor(formData.priority)}>
                        {formData.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Next Steps:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Order will be reviewed by office clerk</li>
                      <li>• Job summary will be created for production</li>
                      <li>• Work will be assigned to steel cutters</li>
                      <li>• Progress will be tracked through completion</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Job Order
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <ToastContainer />
    </div>
  );
};

export default NewJobOrder;