import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Package, Plus, Layers } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SteelItemRow } from "./SteelItemRow";
import { SteelItem, SteelType } from "@/types/order.types";

type ItemsSectionProps = {
  steelItems: SteelItem[];
  setSteelItems: React.Dispatch<React.SetStateAction<SteelItem[]>>;
  updateSteelItem: <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K]
  ) => void;
  addSteelItem: () => void;
  removeSteelItem: (id: SteelItem["id"]) => void;
  steelTypes: SteelType[];
  useJob: boolean;
  setUseJob: React.Dispatch<React.SetStateAction<boolean>>;
  searchItem: string;
  setsearchItem: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
};

export function ItemsSection({
  steelItems,
  setSteelItems,
  updateSteelItem,
  addSteelItem,
  removeSteelItem,
  steelTypes,
  useJob,
  setUseJob,
  searchItem,
  setsearchItem,
  loadingSteel,
}: ItemsSectionProps) {
  const MAX_ITEMS = 15;

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
    const sourceItem = steelItems.find((item) => item.id === id);
    if (!sourceItem) return;

    const newItem: SteelItem = {
      ...sourceItem,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setSteelItems((prev) => [...prev, newItem]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ids = useMemo(() => steelItems.map((x) => x.id), [steelItems]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setSteelItems((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id);
      const newIndex = prev.findIndex((x) => x.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
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
              setUseJob((prev) => !prev);
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

      {/* Add button bottom */}
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
  );
}
