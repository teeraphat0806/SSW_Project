import React from "react";
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
import {
  Package,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Hash,
  Edit3,
  Layers,
  Ruler,
} from "lucide-react";

// --- Types (คงเดิม) ---
export type SteelItemType = {
  id: string;
  steelType: string;
  shape: "line" | "square" | string;
  quantity: number;
  width: number | null;
  length: number;
  thickness: number;

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
  const MAX_ITEMS = 15;

  const addSteelItemLimited = () => {
    if (steelItems.length >= MAX_ITEMS) {
      alert(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`);
      return;
    }
    addSteelItem();
  };

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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ------------------------------------------------------- */}
      {/* ส่วนหัว: ข้อมูล PO และวันที่ (Header Section)           */}
      {/* ------------------------------------------------------- */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200 hover:shadow-md">
        {/* Header: ปรับให้ดูคลีนขึ้น เอา Background ทึบออก ใช้ Border บางๆ แทน */}
        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex items-center gap-3">
            {/* Icon Box */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                ข้อมูลใบสั่งซื้อ
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
                ระบุเลขที่เอกสาร PO และกำหนดการจัดส่ง
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="pt-6 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. PO Number */}
            <div className="space-y-2 group">
              <Label
                htmlFor="poNumber"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
              >
                เลขที่ใบ PO <span className="text-red-500">*</span>
              </Label>
              <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="poNumber"
                  placeholder="ระบุเลข PO (เช่น PO-2025001)"
                  value={headOrder.poNumber}
                  onChange={(e) =>
                    setheadOrder({ ...headOrder, poNumber: e.target.value })
                  }
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* 2. Your Ref */}
            <div className="space-y-2 group">
              <Label
                htmlFor="yourRef"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
              >
                Your Ref / อ้างอิง<span className="text-red-500">*</span>
              </Label>
              <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
                <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="yourRef"
                  placeholder="ระบุรหัสอ้างอิง"
                  value={headOrder.yourRef}
                  onChange={(e) =>
                    setheadOrder({ ...headOrder, yourRef: e.target.value })
                  }
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* 3. Delivery Date */}
            <div className="space-y-2 group">
              <Label
                htmlFor="deliveryDate"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
              >
                วันที่ต้องการส่ง <span className="text-red-500">*</span>
              </Label>
              <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <Input
                  id="deliveryDate"
                  type="date"
                  min={today}
                  value={headOrder.deliveryDate}
                  onChange={handleDateChange}
                  className="
    pl-10 h-11 
    bg-zinc-50/50 dark:bg-zinc-950/50 
    border-zinc-200 dark:border-zinc-800 
    
    /* 1. กำหนดสีตัวอักษรให้ชัดเจน */
    text-zinc-900 dark:text-zinc-100 
    
    focus:bg-white dark:focus:bg-zinc-950 
    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
    transition-all cursor-pointer

    /* 2. บังคับ Color Scheme ให้ Browser รู้ว่าจะเรนเดอร์ไอคอนสีอะไร */
    [color-scheme:light] dark:[color-scheme:dark]
  "
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------- */}
      {/* ส่วนรายการสินค้า (Items Section)                        */}
      {/* ------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            รายการเหล็ก
            <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
              {steelItems.length} รายการ
            </span>
          </h2>

          <Button
            type="button"
            onClick={addSteelItemLimited}
            disabled={steelItems.length >= MAX_ITEMS}
            className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่มรายการ
          </Button>
        </div>
        {steelItems.length >= MAX_ITEMS && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {steelItems.length}{" "}
            รายการ)
          </p>
        )}

        {/* Items */}
        <div className="space-y-3">
          {steelItems.map((item, idx) => {
            const isLine = item.shape === "line";
            return (
              <div
                key={item.id}
                className="group relative rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* index bubble แบบเดียวกับด้านบน */}
                <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
                  {idx + 1}
                </div>

                <div className="p-4 lg:flex lg:items-center lg:gap-4 lg:p-1">
                  <div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-12 lg:items-center">
                    {/* Steel Type */}
                    <div className="lg:col-span-3 lg:pl-4">
                      <label className="mb-1 block text-sm text-zinc-500 dark:text-zinc-400">
                        ประเภทเหล็ก
                      </label>

                      <Select
                        value={item.steelType || ""}
                        onValueChange={(value) => {
                          const selected = steelTypes.find(
                            (t) => t.name === value
                          );
                          if (selected) {
                            updateSteelItem(
                              item.id,
                              "steelType",
                              selected.name
                            );
                            updateSteelItem(item.id, "shape", selected.shape);
                            // ถ้าเปลี่ยนเป็น line ให้ width เป็น null เหมือนตรรกะด้านบน
                            if (selected.shape === "line") {
                              updateSteelItem(item.id, "width", null);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 border-zinc-200 bg-white text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                          <SelectValue placeholder="เลือกประเภทเหล็ก" />
                        </SelectTrigger>

                        <SelectContent>
                          <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                            <Input
                              placeholder="🔍 ค้นหา..."
                              value={searchItem}
                              onChange={(e) => setsearchItem(e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>

                          {loadingSteel ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">
                              กำลังโหลด...
                            </div>
                          ) : steelTypes.length === 0 ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">
                              ไม่พบข้อมูล
                            </div>
                          ) : (
                            steelTypes.map((type) => (
                              <SelectItem key={type.id} value={type.name}>
                                <span className="font-medium">{type.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {type.shape === "square"
                                    ? "(แผ่น/สี่เหลี่ยม)"
                                    : type.shape === "line"
                                    ? "(เส้น)"
                                    : ""}
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dimensions (ให้รูปแบบเหมือนบน: หนา/กว้าง/ยาว, ถ้า line ซ่อนกว้าง) */}
                    <div
                      className={[
                        "grid gap-2 lg:col-span-4",
                        isLine ? "grid-cols-2" : "grid-cols-3",
                      ].join(" ")}
                    >
                      {/* Thickness */}
                      <div>
                        <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                          {isLine ? "หนากลม" : "หนา"}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            value={item.thickness ?? 0}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "thickness",
                                Math.max(0, Number(e.target.value || 0))
                              )
                            }
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                            mm
                          </span>
                        </div>
                      </div>

                      {/* Width (only square) */}
                      {!isLine && (
                        <div>
                          <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                            กว้าง
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                              value={item.width ?? 0}
                              onChange={(e) =>
                                updateSteelItem(
                                  item.id,
                                  "width",
                                  Math.max(0, Number(e.target.value || 0))
                                )
                              }
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                              mm
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Length */}
                      <div>
                        <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                          ยาว
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            className="h-9 border-zinc-200 bg-white pr-6 text-center focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            value={item.length ?? 0}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "length",
                                Math.max(0, Number(e.target.value || 0))
                              )
                            }
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                            mm
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity (style เหมือนบน) */}
                    <div className="lg:col-span-1">
                      <label className="mb-1 block text-center text-sm text-zinc-500 dark:text-zinc-400">
                        จำนวน
                      </label>
                      <Input
                        type="number"
                        min={1}
                        className="h-9 w-full border-blue-100 bg-blue-50/50 text-center font-semibold text-blue-600 focus-visible:ring-blue-500 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                        value={item.quantity ?? 1}
                        onChange={(e) =>
                          updateSteelItem(
                            item.id,
                            "quantity",
                            Math.max(1, Number(e.target.value || 1))
                          )
                        }
                      />
                    </div>

                    {/* Note + Delete  */}
                    <div className="lg:col-span-4">
                      <label className="mb-1 block text-left text-sm text-zinc-500 dark:text-zinc-400">
                        หมายเหตุ
                      </label>

                      <div className="flex items-center gap-2">
                        <Input
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateSteelItem(item.id, "notes", e.target.value)
                          }
                          placeholder="เช่น ตัดแบ่งครึ่ง, เจาะรูมุม..."
                          className="h-9 border-zinc-200 bg-white text-sm focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />

                        {steelItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSteelItem(item.id)}
                            className="h-9 w-9 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {steelItems.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-950/20 dark:text-zinc-500 dark:border-zinc-800">
              <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>ยังไม่มีรายการเหล็ก กดปุ่ม "เพิ่ม" เพื่อเริ่มรายการ</p>
            </div>
          )}
        </div>

        {/* Add button bottom (ให้เหมือนบน) */}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {steelItems.length} รายการ)
        </p>

        <button
          type="button"
          disabled={steelItems.length >= MAX_ITEMS}
          onClick={addSteelItemLimited}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
        </button>
      </section>
    </div>
  );
}
