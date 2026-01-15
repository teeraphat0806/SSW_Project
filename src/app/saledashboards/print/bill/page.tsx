"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getMonthlyPrintData,
  getYearlyPrintData,
  getMonthlyPrintDataByCustomer,
  getYearlyPrintDataByCustomerAndMonth,
  getYearlyPrintDataByMonth,
  type BillData,
} from "@/lib/saleDashboard/print-utils";
import {
  useBills,
  useCustomers,
} from "@/hooks/saleDashboard/useSaleDashboardData";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { BillPrintComponent } from "@/components/saleDashboard/bill-print-component";

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

  const billsData: BillData[] = (() => {
    if (loading) return [];

    // กรณี 1: ทั้งปี ลูกค้าเจ้าเดียว - แยกบิลตามเดือน
    if (type === "yearly" && customerId !== "all") {
      return getYearlyPrintDataByMonth({
        bills,
        customers,
        year,
        customerId,
        sortOrder: "date-desc",
      });
    }

    // กรณี 2: ทั้งปี ทุกคน - แยกบิลตามเดือนและแยกลูกค้า
    if (type === "yearly" && customerId === "all") {
      return getYearlyPrintDataByCustomerAndMonth({
        bills,
        customers,
        year,
        sortOrder: "date-desc",
      });
    }

    // กรณี 3: ลูกค้าทุกคนรายเดือน - แยกบิลของลูกค้าแต่ละคน
    if (type === "monthly" && customerId === "all") {
      return getMonthlyPrintDataByCustomer({
        bills,
        customers,
        year,
        month,
        sortOrder: "date-desc",
      });
    }

    // กรณี 4: รายเดือน ลูกค้าเจ้าเดียว - บิลเดียว (แบบเดิม)
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <p className="text-lg">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-black print:bg-white print:pl-0">
      {
        <div className="print:hidden sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border shadow-sm">
          <div className="mt-14 md:mt-0 lg:mt-0 max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Preview
              </p>
              <h1 className="text-lg font-semibold text-foreground">
                ตัวอย่างใบวางบิล ({billsData.length} ใบ)
              </h1>
            </div>
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? "กำลังพิมพ์..." : "พิมพ์ใบวางบิล"}
            </Button>
          </div>
        </div>
      }

      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 print:py-0 print:px-0">
        <div className="bg-background shadow-lg rounded-xl border border-border overflow-x-auto print:shadow-none print:border-0 print:rounded-none print:overflow-visible">
          <div className="flex justify-center print:p-0">
            <div className="scale-[0.5] sm:scale-[0.7] md:scale-100 origin-top print:scale-100">
              <BillPrintComponent
                billsData={billsData}
                showPrintButton={false}
                onPrint={handlePrint}
              />
            </div>
          </div>
        </div>
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

          .page-break-section {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintBillPage() {
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
