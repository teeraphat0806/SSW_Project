import React from "react";
import { SteelItem, SteelType, HeadOrderType } from "@/types/order.types";
import { HeaderSection } from "./HeaderSection";
import { ItemsSection } from "./ItemsSection";

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
  useJob,
  setUseJob,
  setSteelItems,
}: AddItemProps) {
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
      <HeaderSection
        headOrder={headOrder}
        setheadOrder={setheadOrder}
      />

      <ItemsSection
        steelItems={steelItems}
        setSteelItems={setSteelItems}
        updateSteelItem={updateSteelItem}
        addSteelItem={addSteelItem}
        removeSteelItem={removeSteelItem}
        steelTypes={steelTypes}
        useJob={useJob}
        setUseJob={setUseJob}
        searchItem={searchItem}
        setsearchItem={setsearchItem}
        loadingSteel={loadingSteel}
      />
    </div>
  );
}
