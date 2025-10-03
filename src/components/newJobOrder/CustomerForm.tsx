import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import "../../app/globals.css";
import { Building2 } from "lucide-react";

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
        <div className="grid grid-cols- md:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="customerName">ชื่อบริษัท *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => updateFormData("customerName", e.target.value)}
              placeholder="บริษัท ABC จำกัด"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="code">เลข Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => updateFormData("code", e.target.value)}
              placeholder="1001"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => updateFormData("customerEmail", e.target.value)}
              placeholder="sompong@gmail.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">เบอร์โทร</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => updateFormData("customerPhone", e.target.value)}
              placeholder="0699857458"
              className="mt-1"
            />
          </div>
       
          {/* <div>
            <Label htmlFor="deliveryDate">วันที่ต้องจัดส่ง</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => updateFormData("deliveryDate", e.target.value)}
              className="mt-1"
            />
          </div> */}

          <div>
            <Label htmlFor="customerPhone">Tax</Label>
            <Input
              id="taxNumber"
              value={formData.taxNumber}
              onChange={(e) => updateFormData("taxNumber", e.target.value)}
              placeholder="3101234567890"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Fax</Label>
            <Input
              id="faxNumber"
              value={formData.faxNumber}
              onChange={(e) => updateFormData("faxNumber", e.target.value)}
              placeholder="3101234567890"
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
            placeholder="123 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110"
            className="mt-1"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
