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
  CalendarClock,
  CheckIcon,
} from "lucide-react";
import { ShapeSteel, CuttingMethod } from "@/types";
import { calculateWeightDetails } from "@/lib/calculateGrandTotal";

// --- Types (คงเดิม) ---
export type SteelItemType = {
  id: string;
  steelType: string;
  shape: ShapeSteel;
  quantity: number;
  width: number | null;
  length: number;
  thickness: number;
  cuttingMethod?: CuttingMethod;
  job?: string | null;
  notes: string;
  weight?: number | null;
  price: number;
  discount: number | null;
  density: number;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
};

export type SteelTypeOption = {
  id: string | number;
  name: string;
  shape: ShapeSteel;
  price: number;
  density: number;
};

export type HeadOrderType = {
  poNumber: string | null;
  credit: number;
  deliveryDate: string;
};

type AddItemProps = {
  steelItems: SteelItemType[];
  updateSteelItem: <K extends keyof SteelItemType>(
    id: SteelItemType["id"],
    field: K,
    value: SteelItemType[K],
  ) => void;
  addSteelItem: () => void;
  removeSteelItem: (id: SteelItemType["id"]) => void;
  steelTypes: SteelTypeOption[];
  headOrder: HeadOrderType;
  setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>>;
  searchItem: string;
  setsearchItem: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
  pofilelength: number;
  useJob: boolean;
  setUseJob: React.Dispatch<React.SetStateAction<boolean>>;
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
  pofilelength,
  useJob,
  setUseJob,
}: AddItemProps) {
  const today = new Date().toISOString().split("T")[0];
  const MAX_ITEMS = 15;
  const noNumberSpinnerClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const fmtKg = (n: number) =>
    Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const addSteelItemLimited = () => {
    if (steelItems.length >= MAX_ITEMS) {
      alert(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`);
      return;
    }
    addSteelItem();
  };

  // const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedDate = e.target.value;
  //   const currentDate = new Date();
  //   const selectedDateTime = new Date(selectedDate);

  //   if (selectedDateTime < currentDate && selectedDate !== "") {
  //     alert("ไม่สามารถเลือกวันที่ผ่านมาแล้วได้ กรุณาเลือกวันที่ในอนาคต");
  //     return;
  //   }
  //   setheadOrder({ ...headOrder, deliveryDate: selectedDate });
  // };

  const preventWheelChangeOnNumberInput = (
    e: React.WheelEvent<HTMLDivElement>,
  ) => {
    const target = e.target;
    if (
      target instanceof HTMLInputElement &&
      target.type === "number" &&
      document.activeElement === target
    ) {
      target.blur();
    }
  };

  return (
    <div
      className="w-full space-y-6 pb-10"
      onWheelCapture={preventWheelChangeOnNumberInput}
    >
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

            {/* {pofilelength > 0 && ( */}
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
                  value={headOrder.poNumber ?? ""}
                  onChange={(e) => {
                    const targetValue = e.target.value;

                    if (pofilelength > 0) {
                      setheadOrder({ ...headOrder, poNumber: targetValue });
                    }
                    setheadOrder({
                      ...headOrder,
                      poNumber: targetValue.trim() === "" ? null : targetValue,
                    });
                  }}
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            {/* )} */}

            {/* 2. Your Ref */}
            <div className="space-y-2 group">
              <Label
                htmlFor="credit"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors"
              >
                เครดิต Credit<span className="text-red-500">*</span>
              </Label>
              <div className="relative transition-all duration-200 ease-in-out transform group-focus-within:-translate-y-0.5">
                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="credit"
                  placeholder="ระบุเครดิต ( 30 )"
                  type="number"
                  min="0"
                  value={headOrder.credit}
                  onChange={(e) =>
                    setheadOrder({
                      ...headOrder,
                      credit: Number(e.target.value),
                    })
                  }
                  className={`pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${noNumberSpinnerClass}`}
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
                  // min={today}
                  value={headOrder.deliveryDate}
                  onChange={(e) => {
                    setheadOrder({
                      ...headOrder,
                      deliveryDate: e.target.value,
                    });
                  }}
                  className="pl-10 h-11 
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

          <div className="flex items-center gap-2">
            {/* Toggle Job */}
            <Button
              type="button"
              variant={useJob ? "default" : "outline"}
              onClick={() => {
                setUseJob((prev) => {
                  const next = !prev;

                  return next;
                });
              }}
              className={[
                "h-10 rounded-xl",
                useJob
                  ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/40",
              ].join(" ")}
            >
              <Layers className="mr-2 h-4 w-4" />
              {useJob ? "กำลังกรอก Job" : "กรอก Job"}
            </Button>

            {/* Add */}
            <Button
              type="button"
              onClick={addSteelItemLimited}
              disabled={
                steelTypes.length === 0 || steelItems.length >= MAX_ITEMS
              }
              className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
              title={"เพิ่มรายการใหม่ (สูงสุด " + MAX_ITEMS + " รายการ)"}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </div>
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
            const selectedType = steelTypes.find(
              (t) => t.name === item.steelType && t.shape === item.shape,
            );
            const selectedValue = selectedType ? String(selectedType.id) : "";
            const estKg = calculateWeightDetails({
              shape: item.shape,
              amount: item.quantity,
              width: item.width ?? undefined,
              length: item.length,
              thickness: item.thickness,
              density: item.density,
              price: item.price,
              discount: item.discount ?? null,
              isOD: item.isOD,
              isServices: item.isServices,
              isPerAmount: item.isPerAmount,
              weight: null,
            }).weight;
            return (
              <div key={item.id} className="group relative">
                <div className="absolute -left-2 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-white shadow-sm dark:bg-blue-600 lg:flex">
                  {idx + 1}
                </div>

                <div className="group relative mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex flex-col gap-y-3">
                    {/* --- ROW 1: ข้อมูลสเปคเหล็ก (Type, Dimensions, Quantity) --- */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
                      {/* 1. Steel Type */}
                      <div className="lg:col-span-3">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          ประเภทเหล็ก
                        </label>
                        <Select
                          value={selectedValue}
                          onValueChange={(value) => {
                            const selected = steelTypes.find(
                              (t) => String(t.id) === value,
                            );
                            if (selected) {
                              updateSteelItem(
                                item.id,
                                "steelType",
                                selected.name,
                              );
                              updateSteelItem(item.id, "shape", selected.shape);
                              updateSteelItem(
                                item.id,
                                "price",
                                Number(selected.price ?? 0),
                              );
                              updateSteelItem(
                                item.id,
                                "density",
                                Number(selected.density ?? item.density ?? 0),
                              );
                              if (selected.shape === "line") {
                                updateSteelItem(item.id, "width", null);
                                updateSteelItem(item.id, "isOD", false);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 w-full border-zinc-200 bg-zinc-50/50 text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                            <SelectValue placeholder="เลือกประเภท" />
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
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                กำลังโหลด...
                              </div>
                            ) : steelTypes.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                ไม่พบข้อมูล
                              </div>
                            ) : (
                              <div className="max-h-48 overflow-y-auto">
                                {steelTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={String(type.id)}
                                  >
                                    <span className="font-medium">
                                      {type.name}
                                    </span>
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {type.shape === "square"
                                        ? "(แผ่น)"
                                        : type.shape === "line"
                                          ? "(เพลา)"
                                          : ""}
                                    </span>
                                    {/* {type.shape === "line" && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      Ø
                                    </span>
                                  )} */}
                                  </SelectItem>
                                ))}
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 2. Dimensions */}
                      <div className="lg:col-span-5">
                        <div
                          className={`grid gap-2 ${
                            isLine ? "grid-cols-2" : "grid-cols-3"
                          }`}
                        >
                          {/* Thickness */}
                          <div>
                            <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {isLine ? "กลม" : "หนา"}
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                                value={item.thickness ?? 0}
                                onChange={(e) =>
                                  updateSteelItem(
                                    item.id,
                                    "thickness",
                                    Math.max(0, Number(e.target.value || 0)),
                                  )
                                }
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                mm
                              </span>
                            </div>
                          </div>

                          {/* Width (Only Square) */}
                          {!isLine && (
                            <div>
                              <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {item.isOD === true ? "OD." : "กว้าง"}
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  inputMode="decimal"
                                  className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                                  value={item.width ?? 0}
                                  onChange={(e) =>
                                    updateSteelItem(
                                      item.id,
                                      "width",
                                      Math.max(0, Number(e.target.value || 0)),
                                    )
                                  }
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                  mm
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Length */}
                          <div>
                            <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {item.isOD === true ? "ID." : "ยาว"}
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                className={`h-10 border-zinc-200 bg-white pr-7 text-center hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                                value={item.length ?? 0}
                                onChange={(e) =>
                                  updateSteelItem(
                                    item.id,
                                    "length",
                                    Math.max(0, Number(e.target.value || 0)),
                                  )
                                }
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                                mm
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Quantity */}
                      <div className="lg:col-span-2">
                        <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          จำนวน
                        </label>
                        <Input
                          type="number"
                          min={0}
                          className={`h-10 w-full border-blue-200 bg-blue-50 text-center font-bold text-blue-700 shadow-sm focus-visible:ring-blue-500 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400 ${noNumberSpinnerClass}`}
                          value={item.quantity ?? 1}
                          onChange={(e) =>
                            updateSteelItem(
                              item.id,
                              "quantity",
                              Math.max(1, Number(e.target.value || 1)),
                            )
                          }
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-1.5 block text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          น้ำหนักประมาณ {fmtKg(estKg)} Kg.
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            inputMode="decimal"
                            className={`h-10 border-zinc-200 bg-white pr-8 text-right font-mono text-sm hover:border-blue-400 focus-visible:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${noNumberSpinnerClass}`}
                            value={item.weight ?? 0}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "weight",
                                Math.max(0, Number(e.target.value || 0)),
                              )
                            }
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                            Kg.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* เส้นคั่นบางๆ เพื่อแบ่งโซน (Optional) */}
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800" />

                    {/* --- ROW 2: รายละเอียดเพิ่มเติม (Cutting, Job, Note, Action) --- */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                      {/* 4. Cutting Method */}
                      <div className="flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          วิธีตัด
                        </label>
                        <Select
                          value={item.cuttingMethod ?? "normal"}
                          onValueChange={(value) =>
                            updateSteelItem(
                              item.id,
                              "cuttingMethod",
                              value as CuttingMethod,
                            )
                          }
                        >
                          <SelectTrigger className="h-10 w-full min-w-[160px] border-zinc-200 bg-white text-sm focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                            <SelectValue placeholder="เลือกวิธีตัด" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">ตัดปกติ</SelectItem>
                            <SelectItem value="FB">F/P</SelectItem>
                            <SelectItem value="RM">R/M</SelectItem>
                            <SelectItem value="CNC">CNC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!isLine && (
                        <div className="flex-none">
                          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            OD
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              updateSteelItem(
                                item.id,
                                "isOD",
                                item.isOD === true ? false : true,
                              )
                            }
                            disabled={isLine}
                            className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                            ${
                              item.isOD === true
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            }
                            ${isLine ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center
                              ${
                                item.isOD === true
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {item.isOD === true && (
                                <CheckIcon className="w-3 h-3 text-white" />
                              )}
                            </div>
                            OD
                          </button>
                        </div>
                      )}

                      <div className="flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Services
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextIsServices = !item.isServices;
                            updateSteelItem(
                              item.id,
                              "isServices",
                              nextIsServices,
                            );
                            updateSteelItem(
                              item.id,
                              "isPerAmount",
                              nextIsServices ? true : item.isPerAmount,
                            );
                          }}
                          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                            ${
                              item.isServices === true
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            }
                           `}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center
                              ${
                                item.isServices === true
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-zinc-300 bg-white"
                              }`}
                          >
                            {item.isServices === true && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                          M/S
                        </button>
                      </div>

                      <div className="flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          การคิดราคา
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateSteelItem(
                              item.id,
                              "isPerAmount",
                              !item.isPerAmount,
                            )
                          }
                          className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all
                            ${
                              item.isPerAmount === true
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            }
                           `}
                        >
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center
                              ${
                                item.isPerAmount === true
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-zinc-300 bg-white"
                              }`}
                          >
                            {item.isPerAmount === true && (
                              <CheckIcon className="w-3 h-3 text-white" />
                            )}
                          </div>
                          ต่อชิ้น
                        </button>
                      </div>

                      <div className="w-full sm:w-40 lg:w-32 flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {item.isPerAmount === false
                            ? "ราคาต่อหน่วย (บาท)"
                            : "ราคาต่อชิ้น (บาท)"}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={item.price ?? 0}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "price",
                                Math.max(0, Number(e.target.value || 0)),
                              )
                            }
                            placeholder="0"
                            className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                            ฿
                          </span>
                        </div>
                      </div>

                      <div className="w-full sm:w-40 lg:w-32 flex-none">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          ส่วนลด (บาท)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            value={item.discount ?? ""}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "discount",
                                e.target.value === ""
                                  ? null
                                  : Math.max(0, Number(e.target.value)),
                              )
                            }
                            placeholder="0"
                            className={`h-10 border-zinc-200 bg-white text-right pr-8 dark:border-zinc-700 dark:bg-zinc-900 ${noNumberSpinnerClass}`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                            ฿
                          </span>
                        </div>
                      </div>

                      {/* 5. Job (แสดงเฉพาะตอน useJob เป็น true) */}
                      {useJob && (
                        <div className="w-full lg:w-32 flex-none">
                          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Job No.
                          </label>
                          <Input
                            type="text"
                            value={item.job ?? ""}
                            onChange={(e) =>
                              updateSteelItem(
                                item.id,
                                "job",
                                e.target.value.trim() === ""
                                  ? null
                                  : e.target.value,
                              )
                            }
                            placeholder="No."
                            className="h-10 border-zinc-200 bg-white text-center dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                      )}

                      {/* 6. Note (ใช้ flex-1 เพื่อดันให้เต็มพื้นที่ที่เหลือ แล้วจะส่งปุ่มลบไปขวาสุด) */}
                      <div className="flex-1 min-w-[150px]">
                        <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          หมายเหตุ
                        </label>
                        <Input
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateSteelItem(item.id, "notes", e.target.value)
                          }
                          placeholder="รายละเอียดเพิ่มเติม..."
                          className="h-10 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>

                      {/* 7. Delete Button (อยู่ขวาสุดเสมอในแนวนอน) */}
                      <div className="flex-none pb-1">
                        {" "}
                        {/* pb-1 เพื่อจัด center กับ input สูง 10 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSteelItem(item.id)}
                          disabled={steelItems.length <= 1}
                          className="h-9 w-9 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:text-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
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
          disabled={steelTypes.length === 0 || steelItems.length >= MAX_ITEMS}
          onClick={addSteelItemLimited}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
        </button>
      </section>
    </div>
  );
}
