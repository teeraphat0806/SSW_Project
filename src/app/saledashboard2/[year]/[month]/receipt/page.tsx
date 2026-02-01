"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

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

// ฟังก์ชันแปลงตัวเลขเป็นตัวอักษรภาษาไทย
function numberToThaiText(number: number): string {
  const digits = [
    "",
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
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  if (number === 0) return "ศูนย์บาท";

  const [bahtPart, satangPart] = number.toFixed(2).split(".");
  const baht = parseInt(bahtPart);
  const satang = parseInt(satangPart);

  let result = "";

  // แปลงส่วนบาท
  if (baht > 0) {
    const bahtStr = baht.toString();
    const len = bahtStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(bahtStr[i]);
      const position = len - i - 1;

      if (digit === 0) continue;

      // กรณีพิเศษ
      if (position === 1 && digit === 1) {
        result += "สิบ";
      } else if (position === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else if (position === 0 && digit === 1 && len > 1) {
        result += "เอ็ด";
      } else {
        result += digits[digit] + positions[position];
      }
    }
    result += "บาท";
  } else {
    result = "ศูนย์บาท";
  }

  // แปลงส่วนสตางค์
  if (satang > 0) {
    const satangStr = satang.toString().padStart(2, "0");
    const len = satangStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(satangStr[i]);
      const position = len - i - 1;

      if (digit === 0) continue;

      // กรณีพิเศษ
      if (position === 1 && digit === 1) {
        result += "สิบ";
      } else if (position === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else if (position === 0 && digit === 1 && len > 1) {
        result += "เอ็ด";
      } else {
        result += digits[digit] + positions[position];
      }
    }
    result += "สตางค์";
  } else {
    result += "ถ้วน";
  }

  return result;
}

interface BillData {
  id: number;
  createdAt: string;
  invoiceNo: string;
  customerName: string;
  customerCode: string;
  customerAddress: string;
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

export default function ReceiptReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const year = params.year as string;
  const month = params.month as string;
  const customerId = searchParams.get("customerId");
  const customerCode = searchParams.get("customerCode") || "";
  const customerName = searchParams.get("customerName") || "";

  const [data, setData] = useState<BillData[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthName = MONTH_NAMES[parseInt(month) - 1];
  const buddhistYear = parseInt(year) + 543;

  // เลขที่เอกสาร (สุ่มหรือใช้รหัสลูกค้า + timestamp)
  const documentNo = customerId
    ? `${customerId}${new Date().getTime().toString().slice(-6)}`
    : new Date().getTime().toString().slice(-8);

  // วันที่ปัจจุบัน (พ.ศ. แบบย่อ)
  const currentDate = new Date();
  const thaiShortDate = `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${(currentDate.getFullYear() + 543).toString().slice(-2)}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `/api/sale/reportOrder?year=${year}&month=${month}`;
        if (customerId && customerId !== "all") {
          url += `&customerId=${customerId}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result: ApiResponse = await response.json();
        if (result.success) {
          setData(result.data);
          setMeta(result.meta);
        } else {
          throw new Error("API returned unsuccessful response");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month, customerId]);

  const handlePrint = () => {
    window.print();
  };

  // แบ่งข้อมูลเป็นหน้า (ประมาณ 15 แถวต่อหน้า)
  const ITEMS_PER_PAGE = 15;
  const pages: BillData[][] = [];
  for (let i = 0; i < data.length; i += ITEMS_PER_PAGE) {
    pages.push(data.slice(i, i + ITEMS_PER_PAGE));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button
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

      {/* Render pages */}
      {pages.length === 0 ? (
        <div className="page-container">
          <div className="page-content">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <div className="text-left">
                  <p className="text-lg font-semibold">
                    บริษัท ครุฑเหล็กการค้า จำกัด
                  </p>
                  <p className="text-base">
                    123 ถนนศรีบุรินทร์ แขวงคลองขุนพิมพา เขตบึงกุ่ม กรุงเทพมหานคร
                    10110
                  </p>
                  <p className="text-base">ภาษี 10110</p>
                </div>
                <div className="text-right text-base">
                  <p>Page 1/1</p>
                </div>
              </div>
              <div className="flex justify-end items-start mb-4">
                <div className="text-right text-lg">
                  <p className="font-semibold">{documentNo}</p>
                  <p>{thaiShortDate}</p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-base">
                  {customerCode || ""} {customerName || ""}
                </p>
              </div>
            </div>

            <div className="text-center py-8">
              <p className="text-zinc-500">ไม่พบข้อมูล</p>
            </div>
          </div>
        </div>
      ) : (
        pages.map((pageData, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          const startIndex = pageIndex * ITEMS_PER_PAGE;

          return (
            <div
              key={pageIndex}
              className="page-container"
              style={{ pageBreakAfter: isLastPage ? "auto" : "always" }}
            >
              <div className="page-content">
                {/* Header - แสดงในทุกหน้า */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-left"></div>
                    <div className="text-right text-base">
                      <p>
                        Page {pageIndex + 1}/{pages.length}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="grid grid-cols-2 ">
                      <div className="ml-20">
                        <p className="text-base ">
                          {pageData[0]?.customerName || customerName || ""}
                        </p>
                        <p className="text-base">
                          {pageData[0]?.customerAddress || ""}
                        </p>
                      </div>
                      <div className="flex justify-end items-start mt-4">
                        <div className="text-right text-lg flex flex-col gap-5">
                          <p className="font-semibold">{documentNo}</p>
                          <p>{thaiShortDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue... label - แสดงเฉพาะหน้าที่ 2+ */}
                {pageIndex > 0 && (
                  <div className="text-right mb-2">
                    <p className="text-xl italic">continue...</p>
                  </div>
                )}

                {/* Table */}
                <table className="w-full bill-table mt-20">
                  <tbody>
                    {pageData.map((bill, index) => (
                      <tr key={bill.id}>
                        <td
                          className="px-2 py-1 text-xl text-left"
                          style={{ width: "5%" }}
                        >
                          {startIndex + index + 1}
                        </td>
                        <td
                          className="px-2 py-1 text-xl text-left"
                          style={{ width: "18%" }}
                        >
                          {bill.invoiceNo || "-"}
                        </td>
                        <td
                          className="px-2 py-1 text-xl text-center"
                          style={{ width: "30%" }}
                        >
                          {new Date(bill.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            },
                          )}
                        </td>
                        <td
                          className="px-2 py-1 text-xl text-right"
                          style={{ width: "17%" }}
                        >
                          ฿{bill.grandTotal.toLocaleString("en-US")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer - Fixed position ที่ด้านล่าง - แสดงเฉพาะหน้าสุดท้าย */}
                {isLastPage && (
                  <div className="fixed-footer">
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold">
                        {numberToThaiText(meta?.totalAmount || 0)}
                      </div>
                      <div className="text-xl font-bold">
                        ฿{(meta?.totalAmount || 0).toLocaleString("en-US")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .print\\:hidden {
            display: none !important;
          }

          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            box-sizing: border-box;
            background: white;
            position: relative;
          }

          .page-content {
            width: 100%;
            height: 100%;
            position: relative;
          }

          .fixed-footer {
            position: absolute;
            bottom: 15mm;
            left: 0;
            right: 0;
            padding: 0 10mm;
          }

          .bill-table {
            width: 100%;
            border-collapse: collapse;
          }

          .bill-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .bill-table tfoot {
            display: table-footer-group;
          }

          .bill-table tbody {
            display: table-row-group;
          }
        }

        @media screen {
          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
          }

          .page-content {
            width: 100%;
            position: relative;
            min-height: 277mm;
          }

          .fixed-footer {
            position: absolute;
            bottom: 15mm;
            left: 0;
            right: 0;
            padding: 0 10mm;
          }

          .bill-table {
            width: 100%;
            border-collapse: collapse;
          }
        }
      `}</style>
    </div>
  );
}
