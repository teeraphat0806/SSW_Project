import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import "../../app/globals.css";

import { Package, Plus, X } from "lucide-react";

export default function AddItem({
  steelItems,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
  po,
  setpo,
}) {
  // คำนวณวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // ฟังก์ชันตรวจสอบว่าวันที่ที่เลือกไม่ใช่วันที่ผ่านมาแล้ว
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const currentDate = new Date();
    const selectedDateTime = new Date(selectedDate);

    // ตรวจสอบว่าวันที่เลือกไม่ใช่วันที่ผ่านมาแล้ว
    if (selectedDateTime < currentDate && selectedDate !== "") {
      alert("ไม่สามารถเลือกวันที่ผ่านมาแล้วได้ กรุณาเลือกวันที่ในอนาคต");
      return;
    }

    setpo({ ...po, deliveryDate: selectedDate });
  };
  return (
    <Card className="shadow-steel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              รายการเหล็กที่ต้องตัด
            </CardTitle>
            <CardDescription>
              เพิ่มรายการเหล็กที่ต้องตัดและระบุรายละเอียดต่างๆ
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addSteelItem}
            variant="outline"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            เพิ่ม
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ✅ กรอกเลข PO และวันที่ครั้งเดียว */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="poNumber">เลขที่ใบ PO</Label>
            <Input
              id="poNumber"
              type="text"
              placeholder="เช่น PO-2025001"
              value={po.poNumber}
              onChange={(e) => setpo({ ...po, poNumber: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="deliveryDate">วันที่ต้องการส่ง</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={po.deliveryDate}
              min={today}
              onChange={handleDateChange}
              className="mt-1"
            />
          </div>
        </div>

        {/* ✅ รายการเหล็ก */}
        {steelItems.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">
                ประเภทที่ {index + 1}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>ประเภทเหล็ก</Label>
                <Select
                  value={item.steelType}
                  onValueChange={(value) =>
                    updateSteelItem(item.id, "steelType", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกประเภทเหล็ก" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground shadow-md border z-50 max-h-[160px] overflow-y-auto">
                    {steelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>จำนวน (ชิ้น)</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "quantity",
                      parseInt(e.target.value)
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>กว้าง (ซม.)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.width}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "width",
                      parseFloat(e.target.value)
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>ยาว (ซม.)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.length}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "length",
                      parseFloat(e.target.value)
                    )
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>หนา (ซม.)</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.thickness}
                  onChange={(e) =>
                    updateSteelItem(
                      item.id,
                      "thickness",
                      parseFloat(e.target.value)
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>รายละเอียดเพิ่มเติม</Label>
              <Textarea
                value={item.notes || ""}
                onChange={(e) =>
                  updateSteelItem(item.id, "notes", e.target.value)
                }
                placeholder="รายละเอียดเพิ่มเติมสำหรับเหล็กชิ้นนี้..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
