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

import "@/app/globals.css";

import { Package, Plus, X } from "lucide-react";

export default function AddItem({
  steelItems,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
  po,
  searchItem,
  setsearchItem,
  loadingSteel,
  setpo,
}) {
  // คำนวณวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // ฟังก์ชันตรวจสอบว่าวันที่ที่เลือกไม่ใช่วันที่ผ่านมาแล้ว
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    const currentDate = new Date();
    const selectedDateTime = new Date(selectedDate);

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
        {/* กรอกเลข PO และวันที่ครั้งเดียว */}
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

        {/* รายการเหล็ก */}
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
              {/* ประเภทเหล็ก */}
              <div>
                <Label>ประเภทเหล็ก</Label>
                <Select
                  value={item.steelType || ""}
                  onValueChange={(value) => {
                    // ✅ หา steel type จาก name (ไม่ใช่ type.steelType)
                    const selected = steelTypes.find(
                      (type) => type.name === value
                    );
                    if (!selected) return;

                    // เก็บชื่อไว้ใน steelType ของรายการ
                    updateSteelItem(item.id, "steelType", selected.name);
                    // เก็บ shape เอาไว้ใช้ซ่อน/โชว์ช่องกว้าง/ยาว/หนา
                    updateSteelItem(item.id, "shape", selected.shape);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกประเภทเหล็ก" />
                  </SelectTrigger>

                  <SelectContent className="bg-background text-foreground shadow-md border z-50 max-h-[200px] overflow-y-auto">
                    <div className="px-2 py-1">
                      <Input
                        placeholder="ค้นหาประเภทเหล็ก..."
                        value={searchItem}
                        onChange={(e) => setsearchItem(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    {loadingSteel && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        กำลังโหลด...
                      </div>
                    )}

                    {!loadingSteel && steelTypes.length === 0 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        ไม่พบประเภทเหล็ก
                      </div>
                    )}

                    {!loadingSteel &&
                      steelTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}{" "}
                          {type.shape === "square"
                            ? "(แผ่น/สี่เหลี่ยม)"
                            : type.shape === "line"
                            ? "(เส้น)"
                            : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* จำนวน */}
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

              {/* กว้าง: สำหรับ shape = square เท่านั้น */}
              {item.shape === "square" && (
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
              )}

              {/* ยาว: square + line */}
              {(item.shape === "square" || item.shape === "line") && (
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
              )}

              {/* หนา: square + line */}
              {(item.shape === "square" || item.shape === "line") && (
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
              )}
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
