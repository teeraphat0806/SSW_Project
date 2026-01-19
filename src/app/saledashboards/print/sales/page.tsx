"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMonthlyPrintData,
  getYearlyPrintData,
  formatCurrency,
  formatDate,
} from "@/lib/saleDashboard/print-utils";
import {
  useBills,
  useCustomers,
} from "@/hooks/saleDashboard/useSaleDashboardData";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

function PrintContent() {
  const searchParams = useSearchParams();
  const [isPrinting, setIsPrinting] = useState(false);
  const { bills, loading: billsLoading } = useBills();
  const { customers, loading: customersLoading } = useCustomers();
  const loading = billsLoading || customersLoading;

  const year = Number.parseInt(searchParams.get("year") || "2025");
  const type = searchParams.get("type") || "monthly";
  const month = Number.parseInt(searchParams.get("month") || "1");
  const customerId = searchParams.get("customer") || "all";
  const sortOrder = (searchParams.get("sort") || "date-desc") as
    | "date-desc"
    | "date-asc"
    | "sales-desc"
    | "sales-asc";
  const isPreview = searchParams.get("preview") === "true";

  const customerName = (() => {
    if (customerId === "all") return "ทั้งหมด";
    const customer = customers.find(
      (c) => c.id === Number.parseInt(customerId)
    );
    return customer?.name || "ไม่ระบุ";
  })();

  const monthlyData =
    type === "monthly" && !loading
      ? getMonthlyPrintData({
          bills,
          customers,
          year,
          month,
          customerId,
          sortOrder,
        })
      : null;
  const yearlyData =
    type === "yearly" && !loading
      ? getYearlyPrintData({
          bills,
          customers,
          year,
          customerId,
          sortOrder,
        })
      : null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  useEffect(() => {
    if (!isPreview) {
      // Auto-trigger print after component mounts
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPreview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p className="text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const getSortLabel = (sort: string) => {
    const labels: { [key: string]: string } = {
      "date-desc": "วันที่: ล่าสุด → เก่าสุด",
      "date-asc": "วันที่: เก่าสุด → ล่าสุด",
      "sales-desc": "ยอดขาย: สูง → ต่ำ",
      "sales-asc": "ยอดขาย: ต่ำ → สูง",
    };
    return labels[sort] || sort;
  };

  const getThaiMonthName = (m: number): string => {
    const months = [
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
    return months[m - 1] || "";
  };

  return (
    <div className="min-h-screen bg-white text-black print:pl-0 pl-2 md:pl-2 lg:pl-2">
      {/* Print Button (only in preview mode, hidden when printing) */}
      {isPreview && (
        <div className="print:hidden sticky top-0 bg-white border-b border-gray-300 p-4 flex justify-between items-center shadow-sm z-10">
          <h1 className="text-lg font-semibold">ตัวอย่างรายงาน</h1>
          <Button onClick={handlePrint} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "กำลังพิมพ์..." : "พิมพ์รายงาน"}
          </Button>
        </div>
      )}

      {/* Print Content */}
      <div className="max-w-[210mm] mx-auto p-8 bg-white text-[16px] print-page">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-3xl font-bold mb-3">
            {type === "monthly"
              ? `รายงานการขายรายเดือน ${getThaiMonthName(month)} ${year}`
              : `รายงานการขายประจำปี ${year}`}
          </h1>
          <div className="text-lg text-gray-700 space-y-1">
            <p>พิมพ์วันที่: {formatDate(new Date())}</p>
            <p>ลูกค้า: {customerName}</p>
            <p>เรียงลำดับ: {getSortLabel(sortOrder)}</p>
          </div>
        </div>

        {/* Monthly Report */}
        {type === "monthly" && monthlyData && (
          <>
            {monthlyData.rows.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">ไม่มีข้อมูลการขายในเดือนนี้</p>
              </div>
            ) : (
              <>
                <table className="w-full border-collapse border border-black mb-6 text-lg leading-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-3 py-1.5 text-center w-16">
                        ลำดับ
                      </th>
                      <th className="border border-black px-3 py-1.5 text-left w-28">
                        วันที่ขาย
                      </th>
                      <th className="border border-black px-3 py-1.5 text-left w-32">
                        เลขที่ Invoice
                      </th>
                      <th className="border border-black px-3 py-1.5 text-left">
                        ชื่อลูกค้า
                      </th>
                      <th className="border border-black px-3 py-1.5 text-right w-32">
                        ยอดขาย (฿)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="border border-black px-3 py-1.5 text-center">
                          {row.rowNumber}
                        </td>
                        <td className="border border-black px-3 py-1.5">
                          {formatDate(row.saleDate)}
                        </td>
                        <td className="border border-black px-3 py-1.5">
                          {row.invoiceNo}
                        </td>
                        <td className="border border-black px-3 py-1.5">
                          {row.customerName}
                        </td>
                        <td className="border border-black px-3 py-1.5 text-right font-mono">
                          {formatCurrency(row.salesAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td
                        colSpan={4}
                        className="border border-black px-3 py-1.5 text-right"
                      >
                        รวมทั้งหมด ({monthlyData.totalOrders} คำสั่งซื้อ)
                      </td>
                      <td className="border border-black px-3 py-1.5 text-right font-mono">
                        {formatCurrency(monthlyData.totalSales)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </>
        )}

        {/* Yearly Report */}
        {type === "yearly" && yearlyData && (
          <>
            {yearlyData.yearlyOrderCount === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">ไม่มีข้อมูลการขายในปีนี้</p>
              </div>
            ) : (
              <>
                {yearlyData.months.map((monthData) => {
                  if (monthData.rows.length === 0) return null;

                  return (
                    <div
                      key={monthData.month}
                      className="mb-8 break-inside-avoid"
                    >
                      {/* Month Header */}
                      <h2 className="text-2xl font-bold mb-3 bg-gray-200 px-3 py-2 border-l-4 border-black">
                        {monthData.monthName} {year}
                      </h2>

                      <table className="w-full border-collapse border border-black mb-4 text-lg leading-6">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black px-3 py-1.5 text-center w-16">
                              ลำดับ
                            </th>
                            <th className="border border-black px-3 py-1.5 text-left w-28">
                              วันที่ขาย
                            </th>
                            <th className="border border-black px-3 py-1.5 text-left w-32">
                              เลขที่ Invoice
                            </th>
                            <th className="border border-black px-3 py-1.5 text-left">
                              ชื่อลูกค้า
                            </th>
                            <th className="border border-black px-3 py-1.5 text-right w-32">
                              ยอดขาย (฿)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthData.rows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td className="border border-black px-3 py-1.5 text-center">
                                {row.rowNumber}
                              </td>
                              <td className="border border-black px-3 py-1.5">
                                {formatDate(row.saleDate)}
                              </td>
                              <td className="border border-black px-3 py-1.5">
                                {row.invoiceNo}
                              </td>
                              <td className="border border-black px-3 py-1.5">
                                {row.customerName}
                              </td>
                              <td className="border border-black px-3 py-1.5 text-right font-mono">
                                {formatCurrency(row.salesAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-100 font-semibold">
                            <td
                              colSpan={4}
                              className="border border-black px-3 py-1.5 text-right"
                            >
                              รวม {monthData.monthName} ({monthData.orderCount}{" "}
                              คำสั่งซื้อ)
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono">
                              {formatCurrency(monthData.subtotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })}

                {/* Yearly Total */}
                <div className="mt-8 border-t-4 border-black pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold bg-gray-100 px-4 py-3 border border-black">
                    <span>
                      รวมทั้งปี {year} ({yearlyData.yearlyOrderCount}{" "}
                      คำสั่งซื้อ)
                    </span>
                    <span className="font-mono">
                      {formatCurrency(yearlyData.yearlyTotal)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          .break-inside-avoid {
            page-break-inside: avoid;
          }

          .print-page {
            page-break-after: auto;
            page-break-before: auto;
            page-break-inside: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          กำลังโหลด...
        </div>
      }
    >
      <PrintContent />
    </Suspense>
  );
}
