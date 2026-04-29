import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import "@/app/globals.css";
import { Building2 } from "lucide-react";

export type CustomerFormData = {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  taxNumber: string;
  faxNumber: string | null;
  deliveryAddress: string;
};

type CustomerFormProps = {
  formData: CustomerFormData;
  updateFormData: <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) => void;
};

export default function CustomerForm({
  formData,
  updateFormData,
}: CustomerFormProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label htmlFor="customerName">
              ชื่อบริษัท <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => updateFormData("customerName", e.target.value)}
              placeholder="บริษัท ABC จำกัด"
              className="mt-1"
            />
          </div>
         
          <div>
            <Label htmlFor="customerEmail">
              Email 
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail ?? ""}
              onChange={(e) =>
                updateFormData(
                  "customerEmail",
                  e.target.value.trim() === "" ? null : e.target.value,
                )
              }
              placeholder="sompong@gmail.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone">
              เบอร์โทร
            </Label>
            <Input
              id="customerPhone"
              type="text"
              minLength={9}
              maxLength={13}
              value={formData.customerPhone ?? ""}
              onChange={(e) =>
                updateFormData(
                  "customerPhone",
                  e.target.value.trim() === "" ? null : e.target.value,
                )
              }
              placeholder="0699857458"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="taxNumber">
              Tax <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taxNumber"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={13}
              maxLength={13}
              value={formData.taxNumber}
              onChange={(e) => updateFormData("taxNumber", e.target.value)}
              placeholder="1234567891234"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="faxNumber">
              Fax
            </Label>
            <Input
              id="faxNumber"
              type="text"
              minLength={7}
              maxLength={13}
              value={formData.faxNumber ?? ""}
              onChange={(e) =>
                updateFormData(
                  "faxNumber",
                  e.target.value.trim() === "" ? null : e.target.value,
                )
              }
              placeholder="3101234567890"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="deliveryAddress">
            ที่อยู่<span className="text-red-500">*</span>
          </Label>
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
