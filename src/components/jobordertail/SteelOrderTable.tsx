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

const cm3ToM3 = (cm3: number) => cm3 / 1_000_000;

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
    const volumeCm3 = width * length * thickness;
    weightPerPiece = cm3ToM3(volumeCm3) * density;
  } else {
    // เหล็กเส้น/กลม (Round Bar) -> thickness คือ diameter
    const r = thickness / 2;
    const areaCm2 = Math.PI * r * r;
    const volumeCm3 = areaCm2 * length;
    weightPerPiece = cm3ToM3(volumeCm3) * density;
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
    <Card className="overflow-hidden rounded-lg shadow-md w-full">
      <CardHeader className="bg-background border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">รายการเหล็ก</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full text-sm text-left">
          {/* Table Header */}
          <div className="bg-muted/50 px-6 py-3 font-medium text-muted-foreground grid grid-cols-4 gap-4">
            <span className="font-bold">ประเภทเหล็ก (ขนาด)</span>
            <span className="font-bold text-center">น้ำหนักรวม (Kg)</span>
            <span className="font-bold text-center">ราคา/กก.</span>
            <span className="text-right font-bold">ราคารวม</span>
          </div>

          {/* Table Body */}
          {processedItems.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              ไม่พบรายการเหล็ก
            </div>
          ) : (
            processedItems.map((item, idx) => (
              <div
                key={idx}
                className="px-6 py-4 border-b last:border-0 grid grid-cols-4 gap-4 bg-background items-center hover:bg-muted/30 transition-colors"
              >
                {/* Col 1: Detail */}
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {item.original.steelType}
                  </span>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span>
                      {item.dimensions.width > 0
                        ? `${item.dimensions.width} x `
                        : ""}
                      {item.dimensions.length} x {item.dimensions.thickness}
                    </span>
                    <span className="mx-2">|</span>
                    <span>x{safeNum(item.original.amount)} ชิ้น</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 border dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.isManual ? "นน.ระบุเอง" : "คำนวณสูตร"}
                    </span>
                  </div>
                  {/* แสดง detail เพิ่มเติมถ้ามี */}
                  {item.original.detail && (
                    <span className="text-xs text-slate-400 mt-0.5 italic">
                      ({item.original.detail})
                    </span>
                  )}
                </div>

                {/* Col 2: Weight */}
                <div className="text-center">{fmt(item.weight)}</div>

                {/* Col 3: Price/Unit */}
                <div className="text-center text-muted-foreground">
                  {fmt(item.original.price)}
                </div>

                {/* Col 4: Total Price */}
                <div className="text-right font-mono font-medium">
                  {fmt(item.totalPrice)}
                </div>
              </div>
            ))
          )}

          {/* Table Footer */}
          {processedItems.length > 0 && (
            <div className="px-6 py-4 grid grid-cols-4 gap-4 bg-muted/20 border-t items-center">
              <span className="font-bold text-primary">รวมทั้งหมด</span>
              <span className="font-bold text-center underline decoration-dotted">
                {fmt(summary.totalWeight)}
              </span>
              <span className="text-center text-muted-foreground">-</span>
              <span className="font-bold text-green-600 text-right text-base">
                {fmt(summary.grandTotal)} บาท
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
