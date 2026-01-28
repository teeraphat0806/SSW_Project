"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMonthlyPrintData,
  getYearlyPrintData,
  getMonthlyReceiptDataByCustomer,
  getYearlyReceiptDataByCustomerAndMonth,
  getYearlyReceiptDataByMonth,
  type ReceiptData,
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

  const receiptsData: ReceiptData[] = (() => {
    if (loading) return [];

    // กรณี 1: ทั้งปี ลูกค้าเจ้าเดียว - แยกใบเสร็จตามเดือน
    if (type === "yearly" && customerId !== "all") {
      return getYearlyReceiptDataByMonth({
        bills,
        customers,
        year,
        customerId,
        sortOrder: "date-desc",
      });
    }

    // กรณี 2: ทั้งปี ทุกคน - แยกใบเสร็จตามเดือนและแยกลูกค้า
    if (type === "yearly" && customerId === "all") {
      return getYearlyReceiptDataByCustomerAndMonth({
        bills,
        customers,
        year,
        sortOrder: "date-desc",
      });
    }

    // กรณี 3: ลูกค้าทุกคนรายเดือน - แยกใบเสร็จของลูกค้าแต่ละคน
    if (type === "monthly" && customerId === "all") {
      return getMonthlyReceiptDataByCustomer({
        bills,
        customers,
        year,
        month,
        sortOrder: "date-desc",
      });
    }

    // กรณี 4: รายเดือน ลูกค้าเจ้าเดียว - ใบเสร็จเดียว (แบบเดิม)
    if (type === "monthly" && customerId !== "all") {
      const customer = customers.find(
        (c) => c.id === Number.parseInt(customerId)
      );
      const monthlyData = getMonthlyPrintData({
        bills,
        customers,
        year,
        month,
        customerId,
        sortOrder: "date-desc",
      });

      return [
        {
          customerName: customer?.name || "ไม่ระบุ",
          customerId: Number.parseInt(customerId),
          customerInfo: customer
            ? {
                name: customer.name,
                address: (customer as any).address,
                phone: (customer as any).tel,
                taxId: (customer as any).taxNumber,
              }
            : undefined,
          type: "monthly" as const,
          year,
          month,
          data: monthlyData,
        },
      ];
    }

    return [];
  })();

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
      <div className="min-h-screen bg-background text-black flex items-center justify-center">
        <p className="text-lg text-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-black print:bg-white print:pl-0">
      {/* Print Button (only in preview mode, hidden when printing) */}
      {
        <div className="print:hidden sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border shadow-sm">
          <div className="mt-14 md:mt-0 lg:mt-0 max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Preview
              </p>
              <h1 className="text-lg font-semibold text-foreground">
                ตัวอย่างใบเสร็จรับเงิน ({receiptsData.length} ใบ)
              </h1>
            </div>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? "กำลังพิมพ์..." : "พิมพ์ใบเสร็จรับเงิน"}
            </Button>
          </div>
        </div>
      }

      {/* Print Content using Component */}

      <ReceiptPrintComponent receiptsData={receiptsData} />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
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

          .page-break {
            page-break-after: always;
            page-break-inside: avoid;
          }

          .page-break-after {
            page-break-after: always;
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
