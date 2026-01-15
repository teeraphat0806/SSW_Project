import {
  formatCurrency,
  formatDate,
  type MonthlyPrintData,
  type YearlyPrintData,
} from "@/lib/saleDashboard/print-utils";

interface ReceiptPrintComponentProps {
  year: number;
  type: "monthly" | "yearly";
  month: number;
  customerName: string;
  monthlyData: MonthlyPrintData | null;
  yearlyData: YearlyPrintData | null;
}

export function ReceiptPrintComponent({
  year,
  type,
  month,
  customerName,
  monthlyData,
  yearlyData,
}: ReceiptPrintComponentProps) {
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
    <div className="max-w-[210mm] mx-auto p-8 bg-white text-[16px] print-page">
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-3">ใบเสร็จรับเงิน</h1>
        <h2 className="text-2xl font-semibold mb-3">
          {type === "monthly"
            ? `${getThaiMonthName(month)} ${year}`
            : `ประจำปี ${year}`}
        </h2>
        <div className="text-lg text-gray-700 space-y-1">
          <p>พิมพ์วันที่: {formatDate(new Date())}</p>
          <p>ลูกค้า: {customerName}</p>
        </div>
      </div>

      {/* Monthly Report */}
      {type === "monthly" && monthlyData && (
        <>
          {monthlyData.rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">ไม่มีข้อมูลในเดือนนี้</p>
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
                      วันที่รับเงิน
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
                      รวมทั้งหมด ({monthlyData.totalOrders} รายการ)
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
                      {monthData.monthName} {year}
                    </h2>

                    <table className="w-full border-collapse border border-black mb-4 text-lg leading-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black px-3 py-1.5 text-center w-16">
                            ลำดับ
                          </th>
                          <th className="border border-black px-3 py-1.5 text-left w-28">
                            วันที่รับเงิน
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
                            รวม {monthData.monthName} ({monthData.orderCount}{" "}
                            รายการ)
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
                    รวมทั้งปี {year} ({yearlyData.yearlyOrderCount} รายการ)
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
  );
}
