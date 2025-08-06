
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "../app/globals.css";
import { 
  Building2, 
} from "lucide-react";

export default function CustomerForm({ formData, updateFormData }) {
  
  
  return (
   <Card className="shadow-steel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-10 w-10 text-primary" />
                    ข้อมูลลูกค้า
                  </CardTitle>
                  <CardDescription>
                    กรอกรายละเอียดลูกค้าและข้อมูลการจัดส่ง
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="poNumber">เลขใบออเดอร์ใบ PO *</Label>
                      <Input
              id="poNumber"
              value={formData.poNumber}
              onChange={(e) => updateFormData("poNumber", e.target.value)}
              placeholder="PO-2024-001"
              className="mt-1"
            />
                    </div>
                    <div>
                      <Label htmlFor="customerName">ชื่อบริษัท *</Label>
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
                      <Label htmlFor="customerEmail">Email</Label>
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
                      <Label htmlFor="customerPhone">เบอร์โทร</Label>
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
                    <Label htmlFor="deliveryAddress">ที่อยู่</Label>
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
  );
}