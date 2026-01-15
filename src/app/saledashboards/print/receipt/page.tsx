"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMonthlyPrintData,
  getYearlyPrintData,
} from "@/lib/saleDashboard/print-utils";
import {
  useBills,
  useCustomers,
} from "@/hooks/saleDashboard/useSaleDashboardData";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ReceiptPrintComponent } from "@/components/saleDashboard/receipt-print-component";

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
          sortOrder: "date-desc",
        })
      : null;
  const yearlyData =
    type === "yearly" && !loading
      ? getYearlyPrintData({
          bills,
          customers,
          year,
          customerId,
          sortOrder: "date-desc",
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

  return (
    <div className="min-h-screen bg-white text-black print:pl-0 pl-6 md:pl-12 lg:pl-64">
      {/* Print Button (only in preview mode, hidden when printing) */}
      {isPreview && (
        <div className="print:hidden sticky top-0 bg-white border-b border-gray-300 p-4 flex justify-between items-center shadow-sm z-10">
          <h1 className="text-lg font-semibold">ตัวอย่างใบเสร็จรับเงิน</h1>
          <Button onClick={handlePrint} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? "กำลังพิมพ์..." : "พิมพ์ใบเสร็จรับเงิน"}
          </Button>
        </div>
      )}

      {/* Print Content using Component */}
      <ReceiptPrintComponent
        year={year}
        type={type as "monthly" | "yearly"}
        month={month}
        customerName={customerName}
        monthlyData={monthlyData}
        yearlyData={yearlyData}
      />

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

export default function PrintReceiptPage() {
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
