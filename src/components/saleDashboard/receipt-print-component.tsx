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
  customerInfo?: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
}

const ROWS_PER_PAGE = 15; // Adjust based on A4 page height

export function ReceiptPrintComponent({
  year,
  type,
  month,
  customerName,
  monthlyData,
  yearlyData,
  customerInfo,
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

  // Function to paginate rows
  const paginateRows = (rows: any[]) => {
    const pages = [];
    for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
      pages.push(rows.slice(i, i + ROWS_PER_PAGE));
    }
    return pages.length > 0 ? pages : [[]];
  };

  // Function to calculate page subtotal
  const calculatePageSubtotal = (pageRows: any[]) => {
    return pageRows.reduce((sum, row) => sum + (row.salesAmount || 0), 0);
  };

  const getYearlyTotalPages = (data: YearlyPrintData | null) => {
    if (!data) return 1;
    let totalRows = 0;
    data.months.forEach((monthData) => {
      totalRows += monthData.rows.length;
    });
    return totalRows > 0 ? Math.ceil(totalRows / ROWS_PER_PAGE) : 1;
  };

  const monthlyTotalPages =
    type === "monthly" && monthlyData
      ? Math.ceil((monthlyData.rows.length || 0) / ROWS_PER_PAGE) || 1
      : 1;

  const yearlyTotalPages =
    type === "yearly" && yearlyData ? getYearlyTotalPages(yearlyData) : 1;

  // Generate today's date in Thai format
  const today = new Date();
  const thaiYear = today.getFullYear() + 543;
  const thaiDate = `${today.getDate().toString().padStart(2, "0")}/${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${thaiYear.toString().slice(-2)}`;
  const receiptNumber = "25681720"; // Mock receipt number

  return (
    <div className="max-w-[210mm] mx-auto bg-white text-[18px]">
      {/* Monthly Report */}
      {type === "monthly" && monthlyData && (
        <>
          {monthlyData.rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">ไม่มีข้อมูลในเดือนนี้</p>
            </div>
          ) : (
            <>
              {paginateRows(monthlyData.rows).map(
                (pageRows, pageIndex, pages) => (
                  <div
                    key={pageIndex}
                    className="page-break p-6 flex flex-col min-h-screen"
                    style={{
                      pageBreakAfter:
                        pageIndex < pages.length - 1 ? "always" : "auto",
                    }}
                  >
                    {/* Header - Customer Info and Page on each page */}
                    <div className="flex justify-between items-start mb-6">
                      {/* Left: Customer Information */}
                      <div className="text-left text-[16px] leading-snug flex-1">
                        <p className="font-semibold text-[18px]">
                          {customerInfo?.name || customerName}
                        </p>
                        {customerInfo?.address && <p>{customerInfo.address}</p>}
                        {customerInfo?.phone && (
                          <p>โทร. {customerInfo.phone}</p>
                        )}
                        {customerInfo?.taxId && (
                          <p>เลขประจำตัวผู้เสียภาษี {customerInfo.taxId}</p>
                        )}
                      </div>

                      {/* Right: Page Number */}
                      <div className="flex flex-col">
                        <div className="text-right text-[16px] leading-snug">
                          <p className="mt-1">
                            Page {pageIndex + 1}/{pages.length}
                          </p>
                        </div>
                        {/* Receipt Number and Date at bottom */}
                        <div className="flex flex-col gap-5 justify-between text-[16px] mt-4 pt-3 ">
                          <span>{receiptNumber}</span>
                          <span>{thaiDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <table className="w-full mb-4 mt-5 text-[16px] leading-relaxed">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-center w-12"></th>
                            <th className="px-2 py-1 text-left w-24"></th>
                            <th className="px-2 py-1 text-left w-20"></th>
                            <th className="px-2 py-1 text-right"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td className="px-2 py-1 text-center">
                                {row.rowNumber}
                              </td>
                              <td className="px-2 py-1">HS{row.invoiceNo}</td>
                              <td className="px-2 py-1">
                                {String(
                                  new Date(row.saleDate).toLocaleDateString(
                                    "en-GB"
                                  )
                                )}
                              </td>
                              <td className="px-2 py-1 text-right font-mono">
                                {formatCurrency(row.salesAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Page Subtotal */}
                    </div>

                    {/* Page Footer: Continue or Total fixed at bottom */}
                    <div className="mt-auto pt-4">
                      {pageIndex < pages.length - 1 && (
                        <div className="text-right font-semibold text-[16px]">
                          Continue...
                        </div>
                      )}
                      {pageIndex === pages.length - 1 && (
                        <div className="flex justify-end">
                          <div className="pt-2">
                            <div className="flex justify-between text-[16px] font-semibold">
                              <span>
                                รวมทั้งหมด ({monthlyData.totalOrders}{" "}
                                รายการ)&nbsp;&nbsp;&nbsp;&nbsp;
                              </span>
                              <span className="font-mono">
                                {formatCurrency(monthlyData.totalSales)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
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
              {(() => {
                // Flatten all rows across months for pagination
                let allRows: any[] = [];
                let pageMap: {
                  pageIndex: number;
                  monthIndex: number;
                  rowInMonth: number;
                }[] = [];
                let currentPageIndex = 0;
                let currentPageCount = 0;

                yearlyData.months.forEach((monthData, monthIndex) => {
                  monthData.rows.forEach((row, rowIndex) => {
                    pageMap.push({
                      pageIndex: currentPageIndex,
                      monthIndex,
                      rowInMonth: rowIndex,
                    });
                    currentPageCount++;
                    if (currentPageCount >= ROWS_PER_PAGE) {
                      currentPageIndex++;
                      currentPageCount = 0;
                    }
                  });
                });

                const totalPages = currentPageIndex + 1;

                return Array.from({ length: totalPages }).map((_, pageNum) => {
                  const pageRowIndices = pageMap
                    .filter((item) => item.pageIndex === pageNum)
                    .map((item) => ({
                      monthIndex: item.monthIndex,
                      rowInMonth: item.rowInMonth,
                    }));

                  const groupedByMonth = pageRowIndices.reduce((acc, item) => {
                    if (!acc[item.monthIndex]) acc[item.monthIndex] = [];
                    acc[item.monthIndex].push(
                      yearlyData.months[item.monthIndex].rows[item.rowInMonth]
                    );
                    return acc;
                  }, {} as { [key: number]: any[] });

                  return (
                    <div
                      key={pageNum}
                      className="page-break p-6 flex flex-col min-h-screen"
                      style={{
                        pageBreakAfter:
                          pageNum < totalPages - 1 ? "always" : "auto",
                      }}
                    >
                      {/* Header - Customer Info and Page on each page */}
                      <div className="flex justify-between items-start mb-6">
                        {/* Left: Customer Information */}
                        <div className="text-left text-[16px] leading-snug flex-1">
                          <p className="font-semibold text-[18px]">
                            {customerInfo?.name || customerName}
                          </p>
                          {customerInfo?.address && (
                            <p>{customerInfo.address}</p>
                          )}
                          {customerInfo?.phone && (
                            <p>โทร. {customerInfo.phone}</p>
                          )}
                          {customerInfo?.taxId && (
                            <p>เลขประจำตัวผู้เสียภาษี {customerInfo.taxId}</p>
                          )}
                        </div>

                        {/* Right: Page Number */}
                        <div className="text-right text-[16px] leading-snug">
                          <p className="mt-1">
                            Page {pageNum + 1}/{totalPages}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1">
                        {Object.entries(groupedByMonth).map(
                          ([monthIndex, rows]) => {
                            const monthData =
                              yearlyData.months[parseInt(monthIndex)];
                            return (
                              <div key={monthIndex}>
                                {pageNum === pageMap[0]?.pageIndex ||
                                pageMap.some(
                                  (p) =>
                                    p.pageIndex === pageNum &&
                                    p.rowInMonth === 0
                                ) ? (
                                  <h2 className="text-[17px] font-semibold mb-2">
                                    {monthData.monthName} {year}
                                  </h2>
                                ) : null}
                                <table className="w-full mb-3 text-[16px] leading-relaxed">
                                  <thead>
                                    <tr>
                                      <th className="px-2 py-1 text-center w-12"></th>
                                      <th className="px-2 py-1 text-left w-24"></th>
                                      <th className="px-2 py-1 text-left w-20"></th>
                                      <th className="px-2 py-1 text-right"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row) => (
                                      <tr key={row.rowNumber}>
                                        <td className="px-2 py-1 text-center">
                                          {row.rowNumber}
                                        </td>
                                        <td className="px-2 py-1">
                                          {row.invoiceNo}
                                        </td>
                                        <td className="px-2 py-1">
                                          {formatDate(row.saleDate)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                          {formatCurrency(row.salesAmount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                        )}

                        {/* Page Subtotal */}
                        <div className="flex justify-between text-[16px] font-semibold pb-2 mb-2">
                          <span>รวมหน้า {pageNum + 1}</span>
                          <span className="font-mono">
                            {formatCurrency(
                              Object.values(groupedByMonth)
                                .flat()
                                .reduce(
                                  (sum, row) => sum + (row.salesAmount || 0),
                                  0
                                )
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Page Footer: Continue or Year Total fixed at bottom */}
                      <div className="mt-auto pt-4">
                        {pageNum < totalPages - 1 && (
                          <div className="text-right font-semibold text-[16px]">
                            Continue...
                          </div>
                        )}
                        {pageNum === totalPages - 1 && (
                          <div className="flex justify-end">
                            <div className="pt-2">
                              <div className="flex justify-between text-[16px] font-semibold">
                                <span>
                                  รวมทั้งปี {year} (
                                  {yearlyData.yearlyOrderCount}{" "}
                                  รายการ)&nbsp;&nbsp;&nbsp;&nbsp;
                                </span>
                                <span className="font-mono">
                                  {formatCurrency(yearlyData.yearlyTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </>
          )}
        </>
      )}
    </div>
  );
}
