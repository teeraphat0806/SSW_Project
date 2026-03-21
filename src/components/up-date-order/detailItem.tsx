"use client";

import React from "react";
import { toast } from "react-toastify";
import AddItem from "@/components/newJobOrder/AddItem";
import type {
  HeadOrderType,
  ApiOrder,
  SteelItem,
  SteelType,
} from "@/types/order.types";
import type { ShapeSteel } from "@/types";

type Props = {
  job: ApiOrder | null;
  setJob: React.Dispatch<React.SetStateAction<ApiOrder | null>>;
  steelOptions: SteelType[];
  steelQuery: string;
  setSteelQuery: React.Dispatch<React.SetStateAction<string>>;
  loadingSteel: boolean;
  weightEnabled: boolean;
  className?: string;
  useJob: boolean;
  setUseJob: React.Dispatch<React.SetStateAction<boolean>>;
};

const DEFAULT_DENSITY = 0.0000079;

const makeTempId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function DetailItem({
  job,
  setJob,
  steelOptions,
  steelQuery,
  setSteelQuery,
  loadingSteel,
  weightEnabled,
  className,
  useJob,
  setUseJob,
}: Props) {
  if (!job) return null;

  const setSteelItems: React.Dispatch<React.SetStateAction<SteelItem[]>> = (
    next,
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      const nextSteel = typeof next === "function" ? next(prev.steel) : next;
      const withSequence = nextSteel.map((it, idx) => ({
        ...it,
        sequence: idx + 1,
      }));
      return { ...prev, steel: withSequence };
    });
  };

  const updateSteelItem = <K extends keyof SteelItem>(
    id: SteelItem["id"],
    field: K,
    value: SteelItem[K],
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steel: prev.steel.map((it) =>
          it.id === id ? { ...it, [field]: value } : it,
        ),
      };
    });
  };

  const addSteelItem = () => {
    const firstSteelType = steelOptions[0];
    if (!firstSteelType) {
      toast.error("ไม่พบประเภทเหล็กในระบบ", { position: "bottom-right" });
      return;
    }
    const firstShape: ShapeSteel = firstSteelType.shape ?? "square";

    setJob((prev) => {
      if (!prev) return prev;
      const nextSequence =
        prev.steel.length > 0
          ? Math.max(...prev.steel.map((item) => item.sequence ?? 0)) + 1
          : 1;

      const steelIdNum = Number.parseInt(String(firstSteelType.id), 10);

      const newItem: SteelItem = {
        id: makeTempId(),
        SteelId: Number.isFinite(steelIdNum) ? steelIdNum : 0,
        steelType: firstSteelType.steelType ?? "",
        shape: firstShape,
        sequence: nextSequence,
        wide: firstShape === "line" ? null : 0,
        length: 0,
        thickness: 0,
        amount: 1,
        detail: "",
        cuttingMethod: "normal",
        weight: null,
        price: Number(firstSteelType.price ?? 0),
        discount: null,
        density: Number(firstSteelType.density ?? DEFAULT_DENSITY),
        isOD: false,
        isServices: false,
        isPerAmount: false,
        job: null,
      };

      return {
        ...prev,
        steel: [...prev.steel, newItem].map((it, idx) => ({
          ...it,
          sequence: idx + 1,
        })),
      };
    });
  };

  const removeSteelItem = (id: SteelItem["id"]) => {
    setJob((prev) => {
      if (!prev) return prev;
      if (prev.steel.length <= 1) return prev;
      const nextSteel = prev.steel.filter((it) => it.id !== id);
      return {
        ...prev,
        steel: nextSteel.map((it, idx) => ({ ...it, sequence: idx + 1 })),
      };
    });
  };

  const headOrder: HeadOrderType = {
    poNumber: job.poNumber ?? null,
    credit: job.credit ?? 30,
    deliveryDate: job.deliveryDate ?? "",
    createdAt: job.createdAt ?? "",
  };

  const setheadOrder: React.Dispatch<React.SetStateAction<HeadOrderType>> = (
    next,
  ) => {
    setJob((prev) => {
      if (!prev) return prev;
      const prevHead: HeadOrderType = {
        poNumber: prev.poNumber ?? null,
        credit: prev.credit ?? 30,
        deliveryDate: prev.deliveryDate ?? "",
        createdAt: prev.createdAt ?? "",
      };
      const resolved = typeof next === "function" ? next(prevHead) : next;

      return {
        ...prev,
        poNumber: resolved.poNumber ?? null,
        credit: resolved.credit,
        deliveryDate: resolved.deliveryDate,
        createdAt:
          typeof resolved.createdAt === "string" ? resolved.createdAt : null,
      };
    });
  };

  return (
    <div className={className}>
      <AddItem
        steelItems={job.steel ?? []}
        updateSteelItem={updateSteelItem}
        addSteelItem={addSteelItem}
        removeSteelItem={removeSteelItem}
        steelTypes={steelOptions}
        weightEnabled={weightEnabled}
        headOrder={headOrder}
        setheadOrder={setheadOrder}
        searchItem={steelQuery}
        setsearchItem={setSteelQuery}
        loadingSteel={loadingSteel}
        pofilelength={0}
        useJob={useJob}
        setUseJob={setUseJob}
        setSteelItems={setSteelItems}
      />
    </div>
  );
}
