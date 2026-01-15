import {
  formatCurrency,
  formatDate,
  type MonthlyPrintData,
  type YearlyPrintData,
  type BillData,
} from "@/lib/saleDashboard/print-utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface BillPrintComponentProps {
  billsData: BillData[];
  showPrintButton?: boolean;
  onPrint?: () => void;
}

export function BillPrintComponent({
  billsData,
  showPrintButton = true,
  onPrint,
}: BillPrintComponentProps) {
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

  const chunkRows = <T,>(rows: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < rows.length; i += size) {
      chunks.push(rows.slice(i, i + size));
    }
    return chunks;
  };

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!billsData || billsData.length === 0) {
    return (
      <div className="max-w-[210mm] mx-auto p-8 bg-white text-[16px]">
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">ไม่มีข้อมูล</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPrintButton && (
        <div className="mb-4 flex items-center justify-between print:hidden max-w-[210mm] mx-auto">
          <h1 className="text-lg font-semibold">ตัวอย่างใบวางบิล</h1>
          <Button onClick={handlePrintClick} className="gap-2">
            <Printer className="w-4 h-4" />
            พิมพ์ใบวางบิล
          </Button>
        </div>
      )}

      {billsData.map((billData, billIndex) => {
        const isLastBill = billIndex === billsData.length - 1;
        const monthlyData =
          billData.type === "monthly"
            ? (billData.data as MonthlyPrintData)
            : null;
        const yearlyData =
          billData.type === "yearly"
            ? (billData.data as YearlyPrintData)
            : null;

        const monthlyPages =
          monthlyData?.rows && monthlyData.rows.length > 0
            ? chunkRows(monthlyData.rows, 18)
            : [];

        return (
          <div
            key={`bill-${billIndex}`}
            className={`max-w-[210mm] mx-auto p-8 bg-white text-[16px] print-page ${
              !isLastBill ? "page-break-section" : ""
            }`}
          >
            {/* Header (ตามแบบฟอร์ม) */}
            <div className="mb-6">
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">
                  บริษัท เอส.เอส.ดับบลิว.สตีล เซ็นเตอร์ จำกัด
                </p>
                <p className="text-sm font-semibold">
                  S.S.W. STEEL CENTER CO., LTD.
                </p>
                <p className="text-xs text-gray-700">
                  888/1-2 หมู่ที่ 6 ตำบลบางปลา อำเภอบางพลี จังหวัดสมุทรปราการ
                  10540
                </p>
                <p className="text-xs text-gray-700">
                  888/1-2 Moo 9 Banqpla, Banqplee, Samutprakam 10540
                </p>
                <p className="text-xs text-gray-700">
                  TEL.(02)181-6700-3,(02)181-6705-8 FAX.(02)181-6704,
                  (02)181-6709
                </p>
                <h1 className="text-xl font-bold mt-2">ใบวางบิล</h1>
              </div>

              <div className="mt-6 flex justify-between text-sm">
                <div className="space-y-2">
                  <p>
                    นามผู้ซื้อ :{" "}
                    <span className="underline underline-offset-4">
                      {billData.customerName}
                    </span>
                  </p>
                  <p>
                    ทางบริษัท เอส.เอส.ดับบลิว.สตีล เซ็นเตอร์
                    ได้แนบใบวางบิลไว้กับท่านเพื่อให้ท่านได้ตรวจสอบและจัดทำชำระเงิน
                    ตามรายการดังต่อไปนี้
                  </p>
                </div>
                <div className="text-right space-y-2 min-w-[180px]">
                  <p>วันที่ {formatDate(new Date())}</p>
                  <p>เลขที่ _________</p>
                </div>
              </div>
            </div>

            {/* Monthly Report */}
            {billData.type === "monthly" && monthlyData && (
              <>
                {monthlyPages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">ไม่มีข้อมูลในเดือนนี้</p>
                  </div>
                ) : (
                  <>
                    {monthlyPages.map((rows, pageIndex) => {
                      const isLastPage = pageIndex === monthlyPages.length - 1;

                      return (
                        <div
                          key={`monthly-page-${pageIndex}`}
                          className={
                            isLastPage ? undefined : "page-break-section"
                          }
                        >
                          <div className="mb-4 text-sm font-medium">
                            ใบกำกับภาษี - {getThaiMonthName(billData.month!)}{" "}
                            {billData.year}
                          </div>
                          <table className="w-full text-sm leading-6 mb-6">
                            <thead>
                              <tr>
                                <th className="px-2 py-1.5 text-center w-16">
                                  ลำดับที่
                                </th>
                                <th className="px-2 py-1.5 text-left w-32">
                                  วัน เดือน ปี
                                </th>
                                <th className="px-2 py-1.5 text-left w-40">
                                  เลขที่
                                </th>
                                <th className="px-2 py-1.5 text-right w-40">
                                  จำนวนเงิน
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row) => (
                                <tr key={row.rowNumber}>
                                  <td className="px-2 py-1.5 text-center align-middle">
                                    {row.rowNumber}
                                  </td>
                                  <td className="px-2 py-1.5 align-middle">
                                    {formatDate(row.saleDate)}
                                  </td>
                                  <td className="px-2 py-1.5 align-middle">
                                    {row.invoiceNo}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono align-middle">
                                    {formatCurrency(row.salesAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {isLastPage && (
                            <>
                              <div className="flex justify-end mb-6">
                                <div className="border border-black px-4 py-2 text-lg font-semibold min-w-[200px] text-right">
                                  รวมทั้งสิ้น{" "}
                                  {formatCurrency(monthlyData.totalSales)}
                                </div>
                              </div>

                              <p className="text-sm mb-12">
                                โปรดชำระเงินภายใน 30 วัน
                                หลังจากได้รับใบกำกับภาษี
                              </p>

                              <div className="grid grid-cols-2 gap-12 text-sm mt-8">
                                <div className="space-y-8">
                                  <div className="h-12" />
                                  <div className="border-b border-black w-2/3" />
                                  <p>
                                    ผู้วางบิล
                                    ....................................................
                                  </p>
                                  <p>
                                    วันที่นัดชำระเงิน
                                    ........................................
                                  </p>
                                </div>
                                <div className="space-y-8 text-right">
                                  <div className="h-12" />
                                  <div className="border-b border-black w-2/3 ml-auto" />
                                  <p>
                                    ผู้วางบิล
                                    ....................................................
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}

            {/* Yearly Report */}
            {billData.type === "yearly" && yearlyData && (
              <>
                {yearlyData.yearlyOrderCount === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">ไม่มีข้อมูลในปีนี้</p>
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
                            {monthData.monthName} {billData.year}
                          </h2>

                          <table className="w-full border-collapse border border-black mb-4 text-lg leading-6">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-black px-3 py-1.5 text-center w-16">
                                  ลำดับ
                                </th>
                                <th className="border border-black px-3 py-1.5 text-left w-28">
                                  วันที่
                                </th>
                                <th className="border border-black px-3 py-1.5 text-left w-32">
                                  เลขที่ Invoice
                                </th>
                                <th className="border border-black px-3 py-1.5 text-left">
                                  รายละเอียด
                                </th>
                                <th className="border border-black px-3 py-1.5 text-right w-32">
                                  จำนวนเงิน (฿)
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
                                  รวม {monthData.monthName} (
                                  {monthData.orderCount} รายการ)
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
                          รวมทั้งสิ้น ({yearlyData.yearlyOrderCount} รายการ)
                        </span>
                        <span className="font-mono">
                          {formatCurrency(yearlyData.yearlyTotal)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm mb-12 mt-6">
                      โปรดชำระเงินภายใน 30 วัน หลังจากได้รับใบกำกับภาษี
                    </p>

                    <div className="grid grid-cols-2 gap-12 text-sm mt-8">
                      <div className="space-y-8">
                        <div className="h-12" />
                        <div className="border-b border-black w-2/3" />
                        <p>
                          ผู้วางบิล
                          ....................................................
                        </p>
                        <p>
                          วันที่นัดชำระเงิน
                          ........................................
                        </p>
                      </div>
                      <div className="space-y-8 text-right">
                        <div className="h-12" />
                        <div className="border-b border-black w-2/3 ml-auto" />
                        <p>
                          ผู้วางบิล
                          ....................................................
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
