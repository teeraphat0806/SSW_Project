import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  calculateBillSummary,
  calculateWeightDetails,
} from "@/lib/calculateGrandTotal";
import { FileText } from "lucide-react";
import { useMemo } from "react";
import { ShapeSteel, CuttingMethod } from "@/types";
import { de } from "date-fns/locale";

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
  job?: string;
  discount?: number | null;
  cuttingMethod: CuttingMethod;
  shape: ShapeSteel;
  isOD: boolean;
  isServices: boolean;
  isPerAmount: boolean;
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

// --- Main Component ---

interface SteelTableProps {
  vatRate: number;
  steel: SteelItem[];
}

export default function SteelTable({ steel = [], vatRate }: SteelTableProps) {
  const processedItems = useMemo(
    () =>
      steel.map((item) => ({
        item,
        details: calculateWeightDetails(item),
      })),
    [steel],
  );

  // Summary logic
  const { subtotal, discount, vat, grandTotal } = useMemo(
    () => calculateBillSummary(steel, vatRate),
    [steel, vatRate],
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
                สรุปรายการและคำนวณราคา (หนา×กว้าง×ยาว) หรือ (หนา×วงใน×วงนอก)
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
              จำนวน
            </span>
            <span className="col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
              JOB
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-300">
              น้ำหนัก (Kg)
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
              ราคา/กก./ชิ้น
            </span>
            <span className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
              ราคารวม
            </span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {steel.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                  <FileText className="h-6 w-6 opacity-30" />
                </div>
                <span className="font-medium">ไม่พบรายการเหล็ก</span>
              </div>
            ) : (
              processedItems.map(({ item, details }, idx) => {
                const detail = (item.detail ?? "").trim();
                const discount = safeNum(item.discount);
                const hasNoteRow = discount > 0 || detail.length > 0;

                return (
                  <div
                    key={idx}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors duration-200"
                  >
                    {/* ✅ แถวหลักเดิม (ไม่เปลี่ยน layout col) */}
                    <div className="px-6 py-3 grid grid-cols-12 gap-4 items-center">
                      {/* Col 1 */}
                      <div className="col-span-2 flex flex-col justify-center pr-2 gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            {item.steelType} {item.shape === "line" && "(เพลา)"}
                          </span>
                          {item.isPerAmount === false && (
                            <span
                              className={`px-1.5 py-0.5 rounded border font-medium ${
                                item.weight <= 0
                                  ? "bg-orange-100 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400" // สีสำหรับ 'สูตร'
                                  : "bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400" // สีสำหรับ 'จริง'
                              }`}
                            >
                              {item.weight <= 0 ? "สูตร" : "จริง"}
                            </span>
                          )}

                          {item.cuttingMethod !== "normal" && (
                            <span className="px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                              {item.cuttingMethod == "FB"
                                ? "F/P"
                                : item.cuttingMethod == "RM"
                                  ? "R/M"
                                  : "CNC"}
                            </span>
                          )}
                          {item.isOD === true && (
                            <span className="px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                              OD
                            </span>
                          )}
                          {item.isServices === true && (
                            <span className="px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                              Services
                            </span>
                          )}

                          <span className="px-1.5 py-0.5 rounded border font-medium bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500">
                            {item.isPerAmount ? "ต่อชิ้น" : "ต่อหน่วย"}
                          </span>
                        </div>
                      </div>

                      {/* Col 2 */}
                      <div className="col-span-2 flex items-center font-mono text-sm text-zinc-500 dark:text-zinc-400">
                        {safeNum(item.thickness) > 0 && (
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">
                            {item.thickness}
                          </span>
                        )}

                        {safeNum(item.width) > 0 && (
                          <>
                            <span className="text-zinc-500 dark:text-zinc-500 mx-1.5">
                              ×
                            </span>
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {item.width}
                            </span>
                          </>
                        )}
                        {safeNum(item.length) > 0 && (
                          <>
                            <span className="text-zinc-500 dark:text-zinc-500 mx-1.5">
                              ×
                            </span>
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {item.length}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Col 3 */}

                      <div className="col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        x{safeNum(item.amount)}
                      </div>

                      <div className="col-span-1 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        {item.job ? item.job : "-"}
                      </div>

                      {/* Col 4 */}
                      <div className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-300">
                        {details.weight === 0 || details.weight == null
                          ? "-"
                          : fmt(details.weight)}
                      </div>

                      {/* Col 5 */}
                      <div className="col-span-2 text-right font-bold text-zinc-700 dark:text-zinc-400">
                        {fmt(item.price)}
                      </div>

                      {/* Col 6 */}
                      <div className="col-span-2 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {fmt(details.total)}
                      </div>
                    </div>
                    {/* ✅ แถวหมายเหตุเต็มความกว้าง (อยู่ด้านบนของเส้นแบ่ง) */}
                    {hasNoteRow && (
                      <div className="px-6  pb-1">
                        <div className="text-sm leading-4 text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">
                          {/* ส่วนลด */}
                          {discount > 0 && (
                            <span className="mr-2">
                              •{" "}
                              <span className="text-red-600 dark:text-red-400">
                                ลด -{fmt(discount)}
                              </span>{" "}
                              บาท
                            </span>
                          )}

                          {/* detail */}
                          {detail && (
                            <span>
                              {" "}
                              {discount > 0 ? " " : "• "} {detail}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ✅ เส้นแบ่งอยู่ท้าย item (เหมือนเดิม แต่เราเอาออกจาก divide-y) */}
                    <div className="border-b border-zinc-100 dark:border-zinc-800/60" />
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer */}
          {steel.length > 0 && (
            <div className="bg-zinc-50/50 dark:bg-zinc-950 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 text-left font-bold text-zinc-600 dark:text-zinc-400">
                  รวมก่อนส่วนลด
                </div>
                <div className="col-span-6 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {fmt(subtotal)}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 text-left font-bold text-zinc-600 dark:text-zinc-400">
                  ส่วนลดรวม
                </div>
                <div className="col-span-6 text-right font-mono font-bold text-red-600 dark:text-red-400">
                  -{fmt(discount)}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-6 text-left font-bold text-zinc-600 dark:text-zinc-400">
                  VAT {vatRate}%
                </div>
                <div className="col-span-6 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  {fmt(vat)}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="col-span-6 text-left font-bold text-zinc-800 dark:text-zinc-200">
                  ยอดสุทธิ (Grand Total)
                </div>
                <div className="col-span-6 text-right font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {fmt(grandTotal)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
