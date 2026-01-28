import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

// --- Types ---
// กำหนด Type ตามที่คุณระบุมา
export type SteelItem = {
  steelType: string;
  amount: number;
  width?: number;
  length?: number;
  thickness?: number;
  price: number;
  weight: number; // ถ้าส่งมาเป็น 0 ระบบจะคำนวณให้, ถ้ามีค่า > 0 จะใช้ค่านั้นเลย
  detail?: string;
  density: number;
  job?: number;
  cuttingMethod: "normal" | "FB" | "steelDisc";
  shape: string;
};

// --- Helper Functions ---

const safeNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (n: number) =>
  n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const calculateWeightDetails = (item: SteelItem) => {
  const amount = safeNum(item.amount);
  const width = safeNum(item.width);
  const length = safeNum(item.length);
  const thickness = safeNum(item.thickness);
  const density = safeNum(item.density) || 7860;
  const pricePerUnit = safeNum(item.price);
  const manualWeight = safeNum(item.weight);

  // 1. ถ้ามี weight ส่งมา (มากกว่า 0) ให้ใช้ค่านั้นเลย (Manual / Pre-calculated)
  if (manualWeight > 0) {
    return {
      weight: manualWeight,
      totalPrice: manualWeight * pricePerUnit,
      isManual: true,
      dimensions: { width, length, thickness },
    };
  }

  // 2. ถ้า weight = 0 ให้คำนวณตามสูตร
  let weightPerPiece = 0;

  if (width > 0) {
    // เหล็กแผ่น (Plate)
    const volume = width * length * thickness;
    weightPerPiece = volume * density * 0.1; //weightPerPiece = cm3ToM3(volumeCm3) * density;
  } else {
    // เหล็กเส้น/กลม (Round Bar) -> thickness คือ diameter
    const volume = length * length * thickness;
    weightPerPiece = volume * density * 0.1;
  }

  const totalWeight = weightPerPiece * amount;

  return {
    weight: totalWeight,
    totalPrice: totalWeight * pricePerUnit,
    isManual: false,
    dimensions: { width, length, thickness },
  };
};

// --- Main Component ---

interface SteelTableProps {
  steel: SteelItem[];
}

export default function SteelTable({ steel = [] }: SteelTableProps) {
  // Pre-calculate logic
  const processedItems = steel.map((item) => ({
    original: item,
    ...calculateWeightDetails(item),
  }));

  // Summary logic
  const summary = processedItems.reduce(
    (acc, curr) => ({
      totalWeight: acc.totalWeight + curr.weight,
      grandTotal: acc.grandTotal + curr.totalPrice,
    }),
    { totalWeight: 0, grandTotal: 0 }
  );

  return (
    <Card className="overflow-hidden rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Header Section */}
      <CardHeader className="bg-zinc-50/60 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon Box: ปรับให้ดู Minimal แบบ Industrial */}
            <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                รายการเหล็ก
              </CardTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                สรุปรายการและคำนวณราคา
              </p>
            </div>
          </div>
          {/* Action Button Area */}
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <div className="w-full text-sm text-left min-w-[800px]">
          {/* Table Header: ปรับ Grid เป็น 4-3-2-1-2 เพื่อสัดส่วนที่สวยงาม */}
          <div className="bg-zinc-50 dark:bg-zinc-900/80 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-12 gap-4 items-center">
            <span className="col-span-2 font-bold text-zinc-700 dark:text-zinc-300">
              ประเภทเหล็ก
            </span>
            <span className="col-span-2 font-bold text-zinc-700 dark:text-zinc-300">
              ขนาด <span>(มม.)</span>
            </span>

            <span className="col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
              จำนวน <span>(ชิ้น)</span>
            </span>
            <span className="col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
              JOB
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-300">
              น้ำหนัก (Kg)
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
              ราคา/กก.
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
              ราคารวม
            </span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {processedItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                  <FileText className="h-6 w-6 opacity-30" />
                </div>
                <span className="font-medium">ไม่พบรายการเหล็ก</span>
              </div>
            ) : (
              processedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="group px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors duration-200"
                >
                  {/* Col 1: Detail (Span 2) */}
                  <div className="col-span-2 flex flex-col justify-center pr-2 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* ชื่อเหล็ก */}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                        {item.original.steelType}
                      </span>

                      {item.original.cuttingMethod !== "normal" && (
                        <span
                          className={` px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500`}
                        >
                          {item.original.cuttingMethod == "FB"
                            ? "F/P"
                            : "แบนกลม"}
                        </span>
                      )}

                      <span
                        className={` px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500`}
                      >
                        {item.isManual ? "ระบุเอง" : "สูตร"}
                      </span>
                    </div>

                    {item.original.detail && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 italic truncate pl-0.5">
                        {item.original.detail}
                      </span>
                    )}
                  </div>

                  {/* Col 2: Dimensions (Span 2) */}
                  <div className="col-span-2 flex items-center font-mono text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {item.dimensions.thickness}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-500 mx-1.5">
                      ×
                    </span>

                    {item.dimensions.width > 0 && (
                      <>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {item.dimensions.width}
                        </span>
                        <span className=" text-zinc-500 dark:text-zinc-500  mx-1.5">
                          ×
                        </span>
                      </>
                    )}

                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      {item.dimensions.length}
                    </span>
                  </div>

                  {/* Col 3: Amount (Span 1) */}
                  <div className=" col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
                    x{safeNum(item.original.amount)}
                  </div>

                  <div className=" col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
                    {item.original.job ? item.original.job : "-"}
                  </div>

                  {/* Col 4: Weight (Span 2) */}
                  <div className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-300">
                    {fmt(item.weight)}
                  </div>

                  {/* Col 5: Price/Unit (Span 2) */}
                  <div className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
                    {fmt(item.original.price)}
                  </div>

                  {/* Col 6: Total Price (Span 2) */}
                  <div className="col-span-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {fmt(item.totalPrice)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Table Footer */}
          {processedItems.length > 0 && (
            <div className="bg-zinc-50/50 dark:bg-zinc-950 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-6 text-left font-bold text-zinc-600 dark:text-zinc-400 ">
                น้ำหนักรวม
              </div>
              <div className="col-span-2 text-right">
                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700 border-dotted pb-0.5">
                  {fmt(summary.totalWeight)}
                </span>
              </div>

              <div className="col-span-2 text-left">
                <span className=" text-zinc-500 ml-1">Kg</span>
              </div>

              <div className="col-span-2 flex items-baseline justify-end gap-2">
                <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(summary.grandTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
