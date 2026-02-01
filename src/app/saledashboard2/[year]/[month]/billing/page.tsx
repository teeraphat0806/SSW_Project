"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";

const MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

interface BillData {
  id: number;
  createdAt: string;
  invoiceNo: string;
  customerName: string;
  customerCode: string;
  grandTotal: number;
  formatted: {
    createdAt: string;
    grandTotal: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: BillData[];
  meta: {
    year: number;
    month: number;
    monthName: string;
    totalBills: number;
    totalAmount: number;
    formatted: {
      totalAmount: string;
    };
  };
}

// ปรับได้ตามฟอนต์/ความสูงแถวจริงในเครื่องคุณ
const ROWS_PER_PAGE = 22;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
}

/** แปลงเลขเป็นตัวอักษรไทย (บาท/สตางค์) */
function numberToThaiBahtText(num: number): string {
  const thaiNum = [
    "ศูนย์",
    "หนึ่ง",
    "สอง",
    "สาม",
    "สี่",
    "ห้า",
    "หก",
    "เจ็ด",
    "แปด",
    "เก้า",
  ];
  const thaiUnit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

  const readUpToMillion = (n: number): string => {
    if (n === 0) return "";
    const digits = n.toString().split("").map(Number);
    let result = "";

    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      const pos = digits.length - i - 1; // 0..5

      if (d === 0) continue;

      // หลักสิบ
      if (pos === 1) {
        if (d === 1) {
          result += "สิบ";
          continue;
        }
        if (d === 2) {
          result += "ยี่สิบ";
          continue;
        }
        result += thaiNum[d] + "สิบ";
        continue;
      }

      // หลักหน่วย
      if (pos === 0) {
        // ใช้ "เอ็ด" เมื่อมีหลักก่อนหน้า
        if (d === 1 && digits.length > 1) {
          result += "เอ็ด";
          continue;
        }
        result += thaiNum[d];
        continue;
      }

      // หลักอื่น ๆ
      result += thaiNum[d] + thaiUnit[pos];
    }

    return result;
  };

  const readNumber = (n: number): string => {
    if (n === 0) return "ศูนย์";

    let result = "";
    let millionPartCount = 0;
    let current = n;

    while (current > 0) {
      const part = current % 1_000_000;
      current = Math.floor(current / 1_000_000);

      if (part !== 0) {
        const partText = readUpToMillion(part);
        const millionText =
          millionPartCount > 0 ? "ล้าน".repeat(millionPartCount) : "";
        result = partText + millionText + result;
      } else {
        // ถ้าส่วนนี้เป็นศูนย์แต่ยังมีล้านต่อท้าย ให้เพิ่ม "ล้าน" เฉย ๆ เมื่อส่วนหน้าไม่ว่าง (กันกรณีข้ามล้าน)
        if (millionPartCount > 0 && result !== "") {
          result = "ล้าน" + result;
        }
      }

      millionPartCount++;
    }

    return result;
  };

  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);

  let text = readNumber(baht) + "บาท";
  if (satang === 0) text += "ถ้วน";
  else text += readNumber(satang) + "สตางค์";

  return text;
}

export default function BillingReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = params.year as string;
  const month = params.month as string;
  const customerId = searchParams.get("customerId");

  const [data, setData] = useState<BillData[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthName = MONTH_NAMES[parseInt(month) - 1];
  const buddhistYear = parseInt(year) + 543;

  // วันที่ออกเอกสาร (มุมขวาบน)
  const statementDate = useMemo(() => {
    return new Date().toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  // เลขที่เอกสาร (ปรับตามระบบจริงได้)
  const statementNo = useMemo(() => {
    const mm = String(month).padStart(2, "0");
    return `BR-${year}${mm}-${String(customerId ?? "ALL").toUpperCase()}`;
  }, [year, month, customerId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `/api/sale/reportOrder?year=${year}&month=${month}`;
        if (customerId && customerId !== "all")
          url += `&customerId=${customerId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");

        const result: ApiResponse = await response.json();
        if (!result.success)
          throw new Error("API returned unsuccessful response");

        setData(result.data);
        setMeta(result.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, customerId]);

  const pages = useMemo(() => chunk(data, ROWS_PER_PAGE), [data]);
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  const customerName = data[0]?.customerName || "-";
  const totalAmount = meta?.totalAmount ?? 0;

  return (
    // ✅ บังคับสีตาม mode
    <div className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-white print:bg-white print:text-black mt-10 md:mt-0 lg:mt-0">
      {/* Controls */}
      <div className="print:hidden fixed top-20 md:top-4 right-4 z-30 flex gap-2">
        <Button
          className="hover:cursor-pointer"
          variant="outline"
          size="sm"
          onClick={() => router.push(`/saledashboard2/${year}/${month}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
        <Button
          size="sm"
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Printer className="h-4 w-4 mr-2" />
          พิมพ์งาน
        </Button>
      </div>

      <div className="py-6 print:py-0">
        {pages.map((pageRows, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;

          return (
            <section
              key={pageIndex}
              className="a4-page mx-auto bg-white dark:bg-zinc-950 print:bg-white"
            >
              {/* Header */}
              <header className="text-center leading-tight">
                <div className="text-[15px] font-semibold">
                  บริษัท เอส.เอส.ดับบลิว. สตีล เซ็นเตอร์ จำกัด
                </div>
                <div className="text-[15px] font-semibold">
                  S.S.W. STEEL CENTER CO., LTD.
                </div>

                {/* ไม่ใช้สีเทา: ใช้ opacity แทน */}
                <div className="mt-1 text-[12px] opacity-80">
                  888/1-2 หมู่ 9 ตำบลบางปลา อำเภอบางพลี จังหวัดสมุทรปราการ 10540
                </div>
                <div className="mt-1 text-[12px] opacity-80">
                  888/1-2 Moo 9 Bangpla, Bangplee, Samutprakarn 10540
                </div>
                <div className="text-[12px] opacity-80">
                  TEL. (02)181-6700-3, (02)181-6705-8 &nbsp; FAX. (02)181-6704,
                  (02)181-6709
                </div>

                <div className="mt-3 text-[18px] font-semibold">ใบวางบิล</div>
              </header>

              {/* Customer + Date/No */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
                <div className="space-y-1"></div>
                <div className="space-y-1 justify-self-end text-right">
                  <div>
                    <span className="font-semibold">วันที่</span>{" "}
                    {statementDate}
                  </div>
                  <div>
                    <span className="font-semibold">เลขที่</span> {statementNo}
                  </div>

                  <div className="opacity-80">
                    หน้า {pageIndex + 1}/{pages.length}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-[14px]">
                <div className="space-y-1">
                  <div>
                    <span className="font-semibold">นามผู้ซื้อ:</span>{" "}
                    {customerName}
                  </div>
                  <div className="opacity-80">
                    ทางบริษัท เอส.เอส.ดับบลิว.สตีล เซ็นเตอร์
                    ได้มาวางบิลไว้แก่ท่าน เพื่อให้ท่านได้ตรวจสอบและนัดชำระเงิน
                    ตามรายการดังต่อไปนี้
                  </div>
                </div>
              </div>

              {/* Table (no lines, all left, tight spacing, bigger font) */}
              <div className="mt-4">
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr>
                      <th className="th">ลำดับ</th>
                      <th className="th">วัน เดือน ปี</th>
                      <th className="th">เลขที่</th>
                      <th className="th">จำนวนเงิน</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="td text-left opacity-70 py-6"
                        >
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((bill, rowIndex) => {
                        const runningIndex =
                          pageIndex * ROWS_PER_PAGE + rowIndex + 1;
                        const dateStr = new Date(
                          bill.createdAt,
                        ).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        });

                        return (
                          <tr key={bill.id} className="avoid-break">
                            <td className="td">{runningIndex}</td>
                            <td className="td">{dateStr}</td>
                            <td className="td">{bill.invoiceNo || "-"}</td>
                            {/* ✅ จำนวนเงินชิดซ้ายเหมือนช่องอื่น */}
                            <td className="td">
                              {bill.grandTotal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer (last page only) */}
              {isLastPage && (
                <footer className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className=""></div>
                    <div className=""></div>
                    <div className="text-right ">
                      <div className="flex">
                        <div className="mt-2">รวมทั้งสิ้น</div>
                        <div className="total-box">
                          {totalAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div className="mt-1 text-[14px] text-left">
                        ({numberToThaiBahtText(totalAmount)})
                      </div>
                    </div>
                    <div className=""></div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-8 grid grid-cols-2 gap-10 text-[14px]">
                    <div className="signature">
                      <div className="label">ผู้วางบิล</div>
                      <div className="line" />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-10 text-[14px]">
                    <div className="signature">
                      <div className="label">วันที่นัดชำระเงิน</div>
                      <div className="line" />
                    </div>
                    <div className="signature">
                      <div className="label">ผู้วางบิล</div>
                      <div className="line" />
                    </div>
                    <div />
                  </div>
                </footer>
              )}
            </section>
          );
        })}
      </div>

      <style jsx global>{`
        .a4-page {
          width: 210mm;
          min-height: 297mm;
          padding: 14mm 10mm; /* ✅ เบียดซ้าย/ขวาให้มากขึ้น */
          box-sizing: border-box;
          margin-bottom: 12px;
        }

        /* ✅ ตารางไม่มีเส้น + ช่องชิดซ้าย + ช่องไฟน้อย */
        .th,
        .td {
          border: none !important;
          padding: 0px 2px; /* ✅ ให้ช่องใกล้กันมาก */
          text-align: left !important; /* ✅ บังคับทุกช่องชิดซ้าย */
          vertical-align: top;
          white-space: nowrap; /* ✅ ดูเป็น list ชิดๆ */
        }

        .th {
          font-weight: 700;
          font-size: 15px;
          padding-bottom: 4px;
        }

        .td {
          font-size: 15px;
        }

        /* กันแถวถูกตัดกลางหน้า */
        .avoid-break {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* กล่องยอดรวม */
        .total-box {
          border: 2px solid currentColor;
          padding: 6px 12px;
          min-width: 48mm;
          text-align: right;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.2px;
        }

        .signature .label {
          margin-bottom: 6px;
          font-weight: 600;
        }
        .signature .line {
          border-bottom: 1.5px solid currentColor;
          height: 16px;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
          }
          .print\\:hidden {
            display: none !important;
          }
          .a4-page {
            margin: 0;
            page-break-after: always;
            background: #fff !important;
            color: #000 !important;
          }
          .a4-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
