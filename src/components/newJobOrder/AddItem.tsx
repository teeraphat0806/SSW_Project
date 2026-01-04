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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import "@/app/globals.css";

import { Package, Plus, X } from "lucide-react";
import { Checkbox } from "@radix-ui/react-checkbox";
import React from "react";

export type SteelItemType = {
  id: string;
  steelType: string;
  shape: "line" | "square" | string;
  quantity: number;
  width: number | null;
  length: number;
  thickness: number;
  hasNotes: boolean;
  notes: string;
};

export type SteelTypeOption = {
  id: string | number;
  name: string;
  shape: "line" | "square" | string;
};

export type HeadOrderType = {
  poNumber: string;
  yourRef: string;
  deliveryDate: string;
};

type AddItemProps = {
  steelItems: SteelItemType[];
  updateSteelItem: <K extends keyof SteelItemType>(
    id: SteelItemType["id"],
    field: K,
    value: SteelItemType[K]
  ) => void;
  addSteelItem: () => void;
  removeSteelItem: (id: SteelItemType["id"]) => void;
  steelTypes: SteelTypeOption[];
  headOrder: HeadOrderType;
  setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>>;
  searchItem: string;
  setsearchItem: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
};

export default function AddItem({
  steelItems,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
  headOrder,
  setheadOrder,
  searchItem,
  setsearchItem,
  loadingSteel,
}: AddItemProps) {
  const today = new Date().toISOString().split("T")[0];

  // ฟังก์ชันตรวจสอบว่าวันที่ที่เลือกไม่ใช่วันที่ผ่านมาแล้ว
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const currentDate = new Date();
    const selectedDateTime = new Date(selectedDate);

    if (selectedDateTime < currentDate && selectedDate !== "") {
      alert("ไม่สามารถเลือกวันที่ผ่านมาแล้วได้ กรุณาเลือกวันที่ในอนาคต");
      return;
    }

    setheadOrder({ ...headOrder, deliveryDate: selectedDate });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="poNumber">เลขที่ใบ PO</Label>
            <Input
              id="poNumber"
              type="text"
              placeholder="เช่น PO-2025001"
              value={headOrder.poNumber}
              onChange={(e) =>
                setheadOrder({ ...headOrder, poNumber: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="yourRef">yourRef</Label>
            <Input
              id="yourRef"
              type="text"
              placeholder="เช่น REF100"
              value={headOrder.yourRef}
              onChange={(e) =>
                setheadOrder({ ...headOrder, yourRef: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="deliveryDate">วันที่ต้องการส่ง</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={headOrder.deliveryDate}
              min={today}
              onChange={handleDateChange}
              className="mt-1"
            />
          </div>
        </div>

        {/* รายการเหล็ก */}
        {steelItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <div className="border-t border-border my-0" />}
            <div className="bg-muted/30 p-4 rounded-lg my-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                {/* ประเภทเหล็ก */}
                <div>
                  {/* ใช้ Label เป็น Flex Container เพื่อจัดเรียงเลขลำดับและปุ่ม X */}
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center">
                      {/* แสดงเลขลำดับ: จัดรูปแบบให้ดูเด่นและเล็ก */}
                      <span className="inline-flex items-center justify-center h-5 w-5 mr-2 text-xs font-bold bg-background border rounded-full">
                        {index + 1}
                      </span>
                      ประเภทเหล็ก
                    </span>

                    {/* ปุ่มลบ (X): จัดไว้ชิดขวาของ Label */}
                    {steelItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSteelItem(item.id)}
                        // ปรับขนาดปุ่มให้เล็ก h-6 w-6 และเอา padding ออก p-0
                        className="text-destructive h-6 w-6 p-0 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />{" "}
                        {/* ใช้ไอคอนขนาดเล็ก h-3 w-3 */}
                      </Button>
                    )}
                  </Label>

                  <Select
                    value={item.steelType || ""}
                    onValueChange={(value) => {
                      const selected = steelTypes.find(
                        (type) => type.name === value
                      );
                      if (!selected) return;

                      updateSteelItem(item.id, "steelType", selected.name);
                      updateSteelItem(item.id, "shape", selected.shape);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="เลือกประเภทเหล็ก" />
                    </SelectTrigger>

                    <SelectContent className="bg-background text-foreground shadow-md border z-50 max-h-[200px] overflow-y-auto">
                      {/* ... ส่วน Select Options เดิม ... */}
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
                {/* 2. จำนวน */}
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

                {/* 3. กว้าง: สำหรับ shape = square เท่านั้น */}
                {item.shape === "square" && (
                  <div>
                    <Label>กว้าง (ซม.)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.width ?? ""}
                      onChange={(e) =>
                        updateSteelItem(
                          item.id,
                          "width",
                          e.target.value === ""
                            ? null
                            : parseFloat(e.target.value)
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                )}

                {/* 4. ยาว: square + line */}
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

                {/* 5. หนา: square + line */}
                {(item.shape === "square" || item.shape === "line") && (
                  <div>
                    <Label>หนากลม (ซม.)</Label>
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
                {/* 6. คอลัมน์ Checkbox สำหรับรายละเอียดเพิ่มเติม */}
                <div className="col-span-full lg:col-span-1">
                  <div className="flex items-center justify-start h-full">
                    <div className="flex items-center space-x-2 pb-1">
                      <Checkbox
                        id={`has-notes-${item.id}`}
                        checked={item.hasNotes || false}
                        onCheckedChange={(checked) => {
                          const value = Boolean(checked);
                          updateSteelItem(item.id, "hasNotes", value);
                          if (!value) {
                            updateSteelItem(item.id, "notes", "");
                          }
                        }}
                      />
                      <Label
                        htmlFor={`has-notes-${item.id}`}
                        className="cursor-pointer text-sm font-normal hidden lg:block"
                      >
                        {item.hasNotes ? "ซ่อนรายละเอียด" : "เพิ่มรายละเอียด"}
                      </Label>
                      <Label
                        htmlFor={`has-notes-${item.id}`}
                        className="cursor-pointer text-sm font-normal lg:hidden"
                      >
                        รายละเอียดเพิ่มเติม
                      </Label>
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 7. Textarea (แสดงแบบเต็มความกว้างด้านล่างของ Grid เมื่อถูกเลือก) */}
                {/* ---------------------------------------------------- */}
                {item.hasNotes && (
                  // ใช้ col-span-full เพื่อให้ Textarea ขยายเต็มความกว้าง 6 คอลัมน์
                  <div className="col-span-full ">
                    <Label
                      htmlFor={`notes-${item.id}`}
                      className="font-semibold"
                    >
                      รายละเอียดเพิ่มเติม:
                    </Label>
                    <Input
                      id={`notes-${item.id}`}
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateSteelItem(item.id, "notes", e.target.value)
                      }
                      placeholder="รายละเอียดเพิ่มเติมสำหรับเหล็กชิ้นนี้..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}
