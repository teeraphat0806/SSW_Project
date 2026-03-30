import { HeadOrder } from "@/types/quotation.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  ClipboardCheck,
  FileText,
  Layers,
  Package,
  Save,
  User,
  UserPlus,
  CreditCard,
  Briefcase,
  Truck,
  Clock,
  AlignLeft,
} from "lucide-react";
import { Dispatch } from "react";

const salesOptions = [
  { id: 1, name: "J.Sirikarn" },
  { id: 5, name: "A.Prapaporn" },
];

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayValue = toDateInputValue(new Date());

const toDisplayDateValue = (date: Date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${yy}`;
};

type headerProps = {
  headOrder: HeadOrder;
  setheadOrder: Dispatch<React.SetStateAction<HeadOrder>>;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
};

export default function HeaderOrder({
  headOrder,
  setheadOrder,
  customerName,
  onCustomerNameChange,
}: headerProps) {
  return (
    <div>
      <Card className="shadow-steel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            ข้อมูลหัวบิล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* แถวที่ 1 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="headerCustomerName">ชื่อลูกค้า</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="headerCustomerName"
                  value={customerName ?? ""}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="สมพงษ์ โลหะกิจ"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="quotationNo">เลขที่ใบเสนอราคา</Label>
              <div className="relative mt-1">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quotationNo"
                  value={headOrder.quotationNo}
                  onChange={(e) =>
                    setheadOrder((prev) => ({
                      ...prev,
                      quotationNo: e.target.value,
                    }))
                  }
                  placeholder="2026/0001"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="credit">Credit</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="credit"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={headOrder.credit ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setheadOrder((prev) => ({
                      ...prev,
                      credit: raw === "" ? null : Number(raw),
                    }));
                  }}
                  placeholder="30"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="salesName">ผู้ขาย</Label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Select
                  value={
                    headOrder.salesNameId ? String(headOrder.salesNameId) : ""
                  }
                  onValueChange={(value) => {
                    const selected = salesOptions.find(
                      (s) => String(s.id) === value,
                    );
                    setheadOrder((prev) => ({
                      ...prev,
                      salesNameId: selected ? selected.id : 1,
                      salesName: selected ? selected.name : "J.Sirikarn",
                    }));
                  }}
                >
                  <SelectTrigger id="salesName" className="pl-9">
                    <SelectValue placeholder="เลือก Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOptions.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* แถวที่ 2 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <div className="relative mt-1">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deliveryDate"
                  value={headOrder.deliveryDate ?? ""}
                  onChange={(e) =>
                    setheadOrder((prev) => ({
                      ...prev,
                      deliveryDate: e.target.value,
                    }))
                  }
                  placeholder="4-5 วัน"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="period">วันยืนราคา</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="period"
                  value={headOrder.period ?? ""}
                  onChange={(e) =>
                    setheadOrder((prev) => ({
                      ...prev,
                      period: e.target.value,
                    }))
                  }
                  placeholder="4 วัน"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="createdAt">วันที่สร้าง</Label>
              <div className="relative mt-1">
                <Input
                  id="createdAt"
                  type="date"
                  value={toDateInputValue(headOrder.createdAt ?? new Date())}
                  max={todayValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    setheadOrder((prev) => ({
                      ...prev,
                      createdAt: new Date(`${value}T00:00:00`),
                    }));
                  }}
                  className="absolute inset-0 z-10 w-full h-10 cursor-pointer opacity-0"
                />
                {/* กล่องแสดงผลวันที่แบบมีไอคอนด้านซ้ายและขวาตามโครงสร้างเดิม */}
                <div className="pointer-events-none flex h-10 w-full items-center rounded-md border border-input bg-transparent pl-9 pr-3 text-sm">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <div className="flex w-full items-center justify-between">
                    <span className="text-foreground">
                      {toDisplayDateValue(headOrder.createdAt ?? new Date())}
                    </span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="relative mt-1">
                <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="description"
                  value={headOrder.description ?? ""}
                  onChange={(e) =>
                    setheadOrder((prev) => ({
                      ...prev,
                      description:
                        e.target.value.trim() === "" ? null : e.target.value,
                    }))
                  }
                  placeholder="รายละเอียดเพิ่มเติม"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
