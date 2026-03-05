"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


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

interface InvoiceData {
  id: number;
  invoiceNo: number;
  grandTotal: number;
  createdAt: string;
}

interface CustomerData {
  name: string;
  address?: string;
  customerCode?: string;
}

interface StatementReceiptDialogProps {
  customerId: number;
  statementNo: number;
}

export default function StatementReceiptDialog({
  customerId,
  statementNo,
}: StatementReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // วันที่ปัจจุบัน (พ.ศ. แบบย่อ)
  const currentDate = new Date();
  const thaiShortDate = `${String(currentDate.getDate()).padStart(2, "0")}/${String(currentDate.getMonth() + 1).padStart(2, "0")}/${(currentDate.getFullYear() + 543).toString().slice(-2)}`;

  // เลขที่เอกสาร
  const documentNo = `HS${statementNo.toString()}`;

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch customer data
        const customerRes = await fetch(`/api/customer/${customerId}`, {
          cache: "no-store",
        });
        if (!customerRes.ok) throw new Error("Failed to fetch customer");
        const customerData = await customerRes.json();
        setCustomer(customerData);

        // Fetch invoices
        const invoicesRes = await fetch(`/api/invoice/customer/${customerId}`, {
          cache: "no-store",
        });
        if (!invoicesRes.ok) throw new Error("Failed to fetch invoices");
        const invoicesData = await invoicesRes.json();

        // Normalize data
        const items = Array.isArray(invoicesData)
          ? invoicesData
          : Array.isArray(invoicesData?.items)
            ? invoicesData.items
            : [];

        setInvoices(
          items.map((inv: any) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            grandTotal: Number(inv.grandTotal ?? inv.total ?? 0),
            createdAt: inv.createdAt,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, customerId]);

  const handlePrint = () => {
    window.print();
  };
  const handleClose = () => {
    setOpen(false);
  };
  // แบ่งข้อมูลเป็นหน้า (ประมาณ 15 แถวต่อหน้า)
  const ITEMS_PER_PAGE = 15;
  const pages: InvoiceData[][] = [];
  for (let i = 0; i < invoices.length; i += ITEMS_PER_PAGE) {
    pages.push(invoices.slice(i, i + ITEMS_PER_PAGE));
  }

  // คำนวณยอดรวม
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Print receipt"
          className="cursor-pointer border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-100 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Printer size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full max-h-full w-screen h-screen overflow-y-auto bg-white dark:bg-zinc-950 text-gray-900 dark:text-white p-0 border-0 rounded-none">
        <div className="bg-white dark:bg-zinc-950 print:bg-white">
          {/* Print Controls - Hidden when printing */}
          <div className="print:hidden fixed top-20 md:top-4 right-4 z-30 flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
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

          {loading ? (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
              <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
            </div>
          ) : error ? (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
              <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
            </div>
          ) : (
            <>
              {/* Render pages */}
              {pages.length === 0 ? (
                <div className="page-container">
                  <div className="page-content">
                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-left">
                          <p className="text-lg font-semibold text-black dark:text-white print:text-black">
                            บริษัท ครุฑเหล็กการค้า จำกัด
                          </p>
                          <p className="text-base text-black dark:text-white print:text-black">
                            123 ถนนศรีบุรินทร์ แขวงคลองขุนพิมพา เขตบึงกุ่ม
                            กรุงเทพมหานคร 10110
                          </p>
                          <p className="text-base text-black dark:text-white print:text-black">
                            ภาษี 10110
                          </p>
                        </div>
                        <div className="text-right text-base text-black dark:text-white print:text-black">
                          <p>Page 1/1</p>
                        </div>
                      </div>
                      <div className="flex justify-end items-start mb-4">
                        <div className="text-right text-lg text-black dark:text-white print:text-black">
                          <p className="font-semibold">{documentNo}</p>
                          <p>{thaiShortDate}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-base text-black dark:text-white print:text-black">
                          {customer?.customerCode || ""} {customer?.name || ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-center py-8">
                      <p className="text-zinc-500 dark:text-zinc-400">
                        ไม่พบข้อมูล
                      </p>
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
                      style={{
                        pageBreakAfter: isLastPage ? "auto" : "always",
                      }}
                    >
                      <div className="page-content">
                        {/* Header - แสดงในทุกหน้า */}
                        <div className="mb-6 mt-21">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-left"></div>
                            <div className="text-right text-base text-black dark:text-white print:text-black">
                              <p>
                                Page {pageIndex + 1}/{pages.length}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="grid grid-cols-2">
                              <div className="ml-20">
                                <p className="text-base text-black dark:text-white print:text-black">
                                  {customer?.name || ""}
                                </p>
                                <p className="text-base text-black dark:text-white print:text-black">
                                  {customer?.address || ""}
                                </p>
                              </div>
                              <div className="flex justify-end items-start mt-4">
                                <div className="text-right text-lg flex flex-col gap-5 text-black dark:text-white print:text-black">
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
                            <p className="text-xl italic text-black dark:text-white print:text-black">
                              continue...
                            </p>
                          </div>
                        )}

                        {/* Table */}
                        <table className="w-full bill-table mt-20">
                          <tbody>
                            {pageData.map((invoice, index) => (
                              <tr key={invoice.id}>
                                <td
                                  className="px-0 py-1 text-xl text-left text-black dark:text-white print:text-black"
                                  style={{ width: "5%" }}
                                >
                                  {startIndex + index + 1}
                                </td>
                                <td
                                  className="px-2 py-1 text-xl text-left text-black dark:text-white print:text-black"
                                  style={{ width: "18%" }}
                                >
                                  HS
                                  {invoice.invoiceNo
                                    ? String(invoice.invoiceNo).padStart(8, "0")
                                    : "-"}
                                </td>
                                <td
                                  className="px-2 py-1 text-xl text-center text-black dark:text-white print:text-black"
                                  style={{ width: "30%" }}
                                >
                                  {new Date(
                                    invoice.createdAt,
                                  ).toLocaleDateString("th-TH", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                  })}
                                </td>
                                <td
                                  className="px-2 py-1 text-xl text-right text-black dark:text-white print:text-black"
                                  style={{ width: "17%" }}
                                >
                                  ฿{invoice.grandTotal.toLocaleString("en-US")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Footer - Fixed position ที่ด้านล่าง - แสดงเฉพาะหน้าสุดท้าย */}
                        {isLastPage && (
                          <div className="fixed-footer mb-[260px]">
                            <div className="flex justify-between items-center">
                              <div className="text-xl font-bold text-black dark:text-white print:text-black">
                                {numberToThaiText(totalAmount)}
                              </div>
                              <div className="text-xl font-bold text-black dark:text-white print:text-black">
                                ฿{totalAmount.toLocaleString("en-US")}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
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
                page-break-after: always;
              }

              .page-content {
                width: 100%;
                height: 100%;
                position: relative;
                display: flex;
                flex-direction: column;
                min-height: 277mm;
              }

              .fixed-footer {
                position: static;
                margin-top: auto;
                padding: 20mm 0 0 0;
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

              .bill-table td:first-child {
                position: relative;
                left: -18mm;
                padding-left: 8mm !important;
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

              @media (max-width: 768px) {
                .page-container {
                  margin: 10px auto;
                }
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

            /* Dark mode styles for page container */
            @media screen {
              .dark .page-container {
                background: rgb(24 24 27);
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
              }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
}
