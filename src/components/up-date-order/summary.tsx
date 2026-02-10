import React, { useMemo } from "react";
import { Boxes, Calculator, ListChecks } from "lucide-react";

type SteelItem = {
  steelType: string;
  shape: "square" | "line";
  amount: number;
  weight?: number | null;
};

type JobWithSteel = {
  steel: SteelItem[];
};

type SummaryByType = Record<
  string,
  {
    qty: number;
    weight: number; // รวม weight แล้ว (qty * weightPerPiece)
  }
>;

type Props<T extends JobWithSteel> = {
  job: T;
  weightEnabled: boolean;

  // optional helpers: ถ้ามีในไฟล์แม่อยู่แล้ว ส่งเข้ามาได้
  fmtInt?: (n: number) => string;
  fmtWeight?: (n: number) => string;

  className?: string;
};

const defaultFmtInt = (n: number) => new Intl.NumberFormat("th-TH").format(n);
const defaultFmtWeight = (n: number) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);

export default function Summary<T extends JobWithSteel>({
  job,
  weightEnabled,
  fmtInt = defaultFmtInt,
  fmtWeight = defaultFmtWeight,
  className,
}: Props<T>) {
  const { itemCount, uniqueTypeCount, totalQty, totalWeight, summaryByType } =
    useMemo(() => {
      const steel = job.steel ?? [];
      const itemCount = steel.length;

      const typeSet = new Set<string>();
      let totalQty = 0;
      let totalWeight = 0;

      const summaryByType: SummaryByType = {};

      for (const it of steel) {
        const type = (it.steelType || "").trim();
        const shape = it.shape === "line" ? "line" : "square";
        const shapeLabel = shape === "line" ? "เพลา" : "แผ่น";
        const key = `${type || "-"} (${shapeLabel})`;
        if (type) typeSet.add(`${type}::${shape}`);

        const qty = Number(it.amount || 0);
        totalQty += qty;

        const wPerPiece = Number(it.weight ?? 0);
        const wSum = qty * wPerPiece;

        if (weightEnabled) totalWeight += wSum;

        if (!summaryByType[key]) {
          summaryByType[key] = { qty: 0, weight: 0 };
        }
        summaryByType[key].qty += qty;
        summaryByType[key].weight += wSum;
      }

      return {
        itemCount,
        uniqueTypeCount: typeSet.size,
        totalQty,
        totalWeight,
        summaryByType,
      };
    }, [job.steel, weightEnabled]);

  return (
    <section className={`grid gap-6 lg:grid-cols-3 ${className ?? ""}`}>
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:col-span-2 md:grid-cols-4">
        {/* Card 1: รายการทั้งหมด */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
            รายการทั้งหมด
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {fmtInt(itemCount)}
            </span>
            <Boxes className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
          </div>
        </div>

        {/* Card 2: ประเภทเหล็ก */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
            ประเภทเหล็ก
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {fmtInt(uniqueTypeCount)}
            </span>
            <ListChecks className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
          </div>
        </div>

        {/* Card 3: จำนวนชิ้นรวม (Gradient Highlight) */}
        <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-blue-200 dark:from-blue-700 dark:to-indigo-800 dark:shadow-none">
          <div className="text-sm font-medium uppercase text-blue-100">
            จำนวนชิ้นรวม
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold">{fmtInt(totalQty)}</span>
            <span className="mb-1 text-sm text-blue-200">ชิ้น</span>
          </div>
        </div>

        {/* Card 4: น้ำหนักรวม */}
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium uppercase text-zinc-500 dark:text-zinc-400">
            น้ำหนักรวม
          </div>
          <div className="mt-2 flex items-end justify-between">
            {weightEnabled ? (
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {fmtWeight(totalWeight)}
              </span>
            ) : (
              <span className="text-lg font-medium italic text-zinc-400 dark:text-zinc-600">
                --
              </span>
            )}
            <span className="mb-1 text-sm text-zinc-400 dark:text-zinc-500">
              Kg.
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel: Type Breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          <Calculator className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          สรุปแยกประเภท
        </h3>

        <div className="space-y-3">
          {Object.entries(summaryByType).length === 0 && (
            <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
              ยังไม่มีรายการ
            </p>
          )}

          {Object.entries(summaryByType).map(([type, v]) => (
            <div
              key={type}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {type}
                </span>
              </div>

              <div className="text-right">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {fmtInt(v.qty)} ชิ้น
                </span>
                {weightEnabled && (
                  <span className="ml-2 text-sm text-zinc-400 dark:text-zinc-500">
                    ({fmtWeight(v.weight)} kg)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
