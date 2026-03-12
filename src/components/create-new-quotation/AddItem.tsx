import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { SteelItemRow } from "./SteelItemRow";
import { SteelItem, SteelType } from "@/app/create-new-quotation/page";
SteelItemRow;

type AddItemProps = {
  SteelItem: SteelItem[];
  updateSteelItem: <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K],
  ) => void;
  addSteelItem: () => void;
  removeSteelItem: (id: SteelItem["id"]) => void;
  steelTypes: SteelType[];
  searchItem: string;
  setsearchItem: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
  setSteelItems: React.Dispatch<React.SetStateAction<SteelItem[]>>;
};

export default function AddItem({
  SteelItem,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
  searchItem,
  setsearchItem,
  loadingSteel,
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
    if (SteelItem.length >= MAX_ITEMS) {
      alert(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`);
      return;
    }
    addSteelItem();
  };

  const copySteelItem = (id: SteelItem["id"]) => {
    if (SteelItem.length >= MAX_ITEMS) {
      alert(`เพิ่มได้สูงสุด ${MAX_ITEMS} รายการเท่านั้น`);
      return;
    }
    // หารายการที่จะคัดลอก

    const sourceItem = SteelItem.find((item) => item.id === id);
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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => SteelItem.map((x) => x.id), [SteelItem]);

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
      {/* ส่วนรายการสินค้า (Items Section)                        */}
      {/* ------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            รายการเหล็ก
            <span className="ml-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
              {SteelItem.length} รายการ
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Add */}
            <Button
              type="button"
              onClick={addSteelItemLimited}
              disabled={
                steelTypes.length === 0 || SteelItem.length >= MAX_ITEMS
              }
              className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none"
              title={"เพิ่มรายการใหม่ (สูงสุด " + MAX_ITEMS + " รายการ)"}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </div>
        </div>
        {SteelItem.length >= MAX_ITEMS && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {SteelItem.length} รายการ)
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
              {SteelItem.map((item, idx) => (
                <SteelItemRow
                  key={item.id}
                  item={item}
                  idx={idx}
                  steelTypes={steelTypes}
                  searchItem={searchItem}
                  setsearchItem={setsearchItem}
                  loadingSteel={loadingSteel}
                  updateSteelItem={updateSteelItem}
                  onCopyItem={copySteelItem}
                  removeSteelItem={removeSteelItem}
                  steelItemsLength={SteelItem.length}
                />
              ))}

              {SteelItem.length === 0 && (
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
          เพิ่มได้สูงสุด {MAX_ITEMS} รายการ (ตอนนี้ {SteelItem.length} รายการ)
        </p>

        <button
          type="button"
          disabled={steelTypes.length === 0 || SteelItem.length >= MAX_ITEMS}
          onClick={addSteelItemLimited}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-4 text-sm font-medium text-zinc-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        >
          <Plus className="h-4 w-4" /> เพิ่มรายการใหม่
        </button>
      </section>
    </div>
  );
}
