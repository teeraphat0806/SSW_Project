import React, { useMemo } from "react";
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
  Package,
  Plus,
  Calendar,
  FileText,
  Hash,
  Layers,
  CalendarClock,
} from "lucide-react";
import { ShapeSteel, CuttingMethod } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SteelItemRow } from "./SteelItemRow";
import { SteelItem, SteelType } from "@/types/order.types";

export type HeadOrderType = {
  poNumber: string | null;
  credit: number;
  deliveryDate: string;
};

type AddItemProps = {
  steelItems: SteelItem[];
  updateSteelItem: <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K],
  ) => void;
  addSteelItem: () => void;
  removeSteelItem: (id: SteelItem["id"]) => void;
  steelTypes: SteelType[];
  headOrder: HeadOrderType;
  setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>>;
  searchItem: string;
  setsearchItem: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
  pofilelength: number;
  useJob: boolean;
  setUseJob: React.Dispatch<React.SetStateAction<boolean>>;
  setSteelItems: React.Dispatch<React.SetStateAction<SteelItem[]>>;
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
  setSteelItems,
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

  const copySteelItem = (id: SteelItem["id"]) => {
    if (steelItems.length >= MAX_ITEMS) {
      alert(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`);
      return;
    }
    // หารายการที่จะคัดลอก

    const sourceItem = steelItems.find((item) => item.id === id);
    if (!sourceItem) return;

    // สร้างรายการใหม่แต่ทำให้idไม่ซ้ำ
    const newItem: SteelItem = {
      ...sourceItem,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    // เพิ่มรายการใหม่เข้าไปใน state
    setSteelItems((prev) => [...prev, newItem]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const ids = useMemo(() => steelItems.map((x) => x.id), [steelItems]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setSteelItems((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id);
      const newIndex = prev.findIndex((x) => x.id === over.id);
      return arrayMove(prev, oldIndex, newIndex); // ✅ state เรียงใหม่จริง
    });
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {steelItems.map((item, idx) => (
                <SteelItemRow
                  key={item.id}
                  item={item}
                  idx={idx}
                  steelTypes={steelTypes}
                  useJob={useJob}
                  searchItem={searchItem}
                  setsearchItem={setsearchItem}
                  loadingSteel={loadingSteel}
                  updateSteelItem={updateSteelItem}
                  onCopyItem={copySteelItem}
                  removeSteelItem={removeSteelItem}
                  steelItemsLength={steelItems.length}
                />
              ))}

              {steelItems.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-950/20 dark:text-zinc-500 dark:border-zinc-800">
                  <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>ยังไม่มีรายการเหล็ก กดปุ่ม "เพิ่ม" เพื่อเริ่มรายการ</p>
                </div>
              )}
            </SortableContext>
          </DndContext>
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
