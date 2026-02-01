"use client";

import { useParams, useRouter } from "next/navigation";
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

export default function SalesReportPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const month = params.month as string;

  const [data, setData] = useState<BillData[]>([]);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthName = MONTH_NAMES[parseInt(month) - 1];
  const buddhistYear = parseInt(year) + 543;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/sale/reportOrder?year=${year}&month=${month}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

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
  }, [year, month]);

  const handlePrint = () => {
    window.print();
  };

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
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 mt-10 md:mt-0 lg:mt-0">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-20 md:top-4 right-4 z-30 flex gap-2">
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

      {/* A4 Paper */}
      <div className="mx-auto" style={{ width: "210mm", minHeight: "297mm" }}>
        {/* Content */}
        <div className="p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">ใบคุม INVOICE</h1>
            <p className="text-lg text-zinc-600">
              {monthName} {buddhistYear}
            </p>
            <p className="text-lg text-zinc-600">ลูกค้า: ทั้งหมด</p>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border-2 border-black">
            <thead>
              <tr className=" ">
                <th className="border-2 border-black px-3 py-2 text-lg font-bold text-center">
                  ลำดับ
                </th>
                <th className="border-2 border-black px-3 py-2 text-lg font-bold text-center">
                  วันที่ขาย
                </th>
                <th className="border-2 border-black px-3 py-2 text-lg font-bold text-center">
                  เลขที่ Invoice
                </th>
                <th className="border-2 border-black px-3 py-2 text-lg font-bold text-center">
                  ชื่อลูกค้า
                </th>
                <th className="border-2 border-black px-3 py-2 text-lg font-bold text-center">
                  มอดขาย (฿)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="border-2 border-black px-3 py-4 text-center text-lg text-zinc-500"
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                data.map((bill, index) => (
                  <tr key={bill.id}>
                    <td className="border-2 border-black px-3 py-2 text-lg text-center">
                      {index + 1}
                    </td>
                    <td className="border-2 border-black px-3 py-2 text-lg text-center">
                      {new Date(bill.createdAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="border-2 border-black px-3 py-2 text-lg text-center">
                      {bill.invoiceNo || "-"}
                    </td>
                    <td className="border-2 border-black px-3 py-2 text-lg">
                      {bill.customerName}
                    </td>
                    <td className="border-2 border-black px-3 py-2 text-lg text-right">
                      ฿{bill.grandTotal.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-zinc-200 dark:bg-zinc-800">
                <td
                  colSpan={4}
                  className="border-2 border-black px-3 py-2 text-lg font-bold text-right"
                >
                  รวมทั้งหมด ({meta?.totalBills || 0} คำสั่ง)
                </td>
                <td className="border-2 border-black px-3 py-2 text-lg font-bold text-right">
                  ฿{(meta?.totalAmount || 0).toLocaleString("en-US")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        table {
          border: 2px solid #000 !important;
        }

        table th,
        table td {
          border: 2px solid #000 !important;
        }

        /* Prevent page breaks inside table rows */
        table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          @page {
            margin-top: 15mm;
            margin-bottom: 15mm;
          }

          @page :first {
            margin-top: 15mm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            border: 2px solid #000 !important;
            page-break-inside: auto;
          }

          table th,
          table td {
            border: 2px solid #000 !important;
          }

          /* Prevent page breaks inside table rows */
          table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Keep table header on every page */
          thead {
            display: table-header-group;
          }

          /* Keep table footer on every page */
          tfoot {
            display: table-footer-group;
          }

          tbody {
            display: table-row-group;
          }
        }
      `}</style>
    </div>
  );
}
