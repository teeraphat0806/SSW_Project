"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// ฟังก์ชันแปลงตัวเลขเป็นตัวอักษรบาท/สตางค์ (ไทย)
function numberToThaiBahtText(num: number): string {
  const thaiNum = [
    "ศูนย์",
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
  const thaiUnit = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

  const readUpToMillion = (n: number): string => {
    if (n === 0) return "";
    const digits = n.toString().split("").map(Number);
    let result = "";

    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      const pos = digits.length - i - 1;

      if (d === 0) continue;

      if (pos === 1) {
        if (d === 1) {
          result += "สิบ";
          continue;
        }
        if (d === 2) {
          result += "ยี่สิบ";
          continue;
        }
        result += thaiNum[d] + "สิบ";
        continue;
      }

      if (pos === 0) {
        if (d === 1 && digits.length > 1) {
          result += "เอ็ด";
          continue;
        }
        result += thaiNum[d];
        continue;
      }

      result += thaiNum[d] + thaiUnit[pos];
    }

    return result;
  };

  const readNumber = (n: number): string => {
    if (n === 0) return "ศูนย์";

    let result = "";
    let millionPartCount = 0;
    let current = n;

    while (current > 0) {
      const part = current % 1_000_000;
      current = Math.floor(current / 1_000_000);

      if (part !== 0) {
        const partText = readUpToMillion(part);
        const millionText =
          millionPartCount > 0 ? "ล้าน".repeat(millionPartCount) : "";
        result = partText + millionText + result;
      } else {
        if (millionPartCount > 0 && result !== "") {
          result = "ล้าน" + result;
        }
      }

      millionPartCount++;
    }

    return result;
  };

  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);

  let text = readNumber(baht) + "บาท";
  if (satang === 0) text += "ถ้วน";
  else text += readNumber(satang) + "สตางค์";

  return text;
}

const ROWS_PER_PAGE = 22;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
}

interface InvoiceData {
  id: number;
  invoiceNo: number;
  grandTotal: number;
  createdAt: string;
}

interface AcquittanceData {
  id: number;
  acquittanceNo: number;
  customerId: number;
  createdAt: string;
  Customer: {
    name: string;
    address?: string;
  };
  items: Array<{
    invoiceId: number;
    invoice: {
      id: number;
      invoiceNo: number;
      createdAt: string;
      OrderPO: {
        id: number;
        poNumber: string;
        bill: {
          id: number;
          customerId: number;
          grandTotal: number;
        };
      };
    };
    totals: {
      grandTotal: number;
    };
  }>;
}

interface AcquittanceTotals {
  totalAmount: number;
}

interface AcquittanceReceiptDialogProps {
  customerId?: number;
  acquittanceNo: number;
  acquittanceId?: number;
}

export default function AcquittanceReceiptDialog({
  customerId,
  acquittanceNo,
  acquittanceId,
}: AcquittanceReceiptDialogProps) {
  const [open, setOpen] = useState(false);
  const [acquittance, setAcquittance] = useState<AcquittanceData | null>(null);
  const [totals, setTotals] = useState<AcquittanceTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (!open || !acquittanceId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch acquittance with invoices
        const res = await fetch(`/api/acquittance/${acquittanceId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch acquittance");

        const data = await res.json();
        setAcquittance(data.acquittance);
        setTotals(
          data.totals.grandTotal
            ? { totalAmount: data.totals.grandTotal }
            : null,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, acquittanceId]);

  // Convert invoices for display
  const invoices: InvoiceData[] = acquittance?.items
    ? acquittance.items.map((item) => ({
        id: item.invoice.id,
        invoiceNo: item.invoice.invoiceNo,
        grandTotal: Number(item.invoice.OrderPO.bill.grandTotal || 0),
        createdAt: item.invoice.createdAt,
      }))
    : [];

  const pages: InvoiceData[][] = useMemo(
    () => chunk(invoices, ROWS_PER_PAGE),
    [invoices],
  );

  const customerName = acquittance?.Customer?.name || "-";
  const totalAmount = totals?.totalAmount ?? 0;

  // วันที่ปัจจุบัน (พ.ศ.)
  const currentDate = new Date();
  const statementDate = currentDate.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // เลขที่เอกสาร
  const documentNo = `${acquittanceNo.toString()}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Print acquittance receipt"
          className="cursor-pointer border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-100 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Printer size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full max-h-full w-screen h-screen overflow-y-auto bg-white dark:bg-zinc-950 text-gray-900 dark:text-white p-0 border-0 rounded-none">
        <div className="bg-white dark:bg-zinc-950 print:bg-white">
          {/* Print Controls */}
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
            <div className="py-6 print:py-0">
              {pages.map((pageRows, pageIndex) => {
                const isLastPage = pageIndex === pages.length - 1;

                return (
                  <section
                    key={pageIndex}
                    className="a4-page mx-auto bg-white dark:bg-zinc-950 print:bg-white"
                  >
                    {/* Header */}
                    <header className="text-center leading-tight">
                      <div className="text-[15px] font-semibold">
                        บริษัท เอส.เอส.ดับบลิว. สตีล เซ็นเตอร์ จำกัด
                      </div>
                      <div className="text-[15px] font-semibold">
                        S.S.W. STEEL CENTER CO., LTD.
                      </div>

                      <div className="mt-1 text-[12px] opacity-80">
                        888/1-2 หมู่ 9 ตำบลบางปลา อำเภอบางพลี จังหวัดสมุทรปราการ
                        10540
                      </div>
                      <div className="mt-1 text-[12px] opacity-80">
                        888/1-2 Moo 9 Bangpla, Bangplee, Samutprakarn 10540
                      </div>
                      <div className="text-[12px] opacity-80">
                        TEL. (02)181-6700-3, (02)181-6705-8 &nbsp; FAX.
                        (02)181-6704, (02)181-6709
                      </div>

                      <div className="mt-3 text-[18px] font-semibold">
                        ใบวางบิล
                      </div>
                    </header>

                    {/* Customer + Date/No */}
                    <div className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
                      <div className="space-y-1"></div>
                      <div className="space-y-1 justify-self-end w-full max-w-[200px]">
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                          <span className="font-semibold text-left">
                            วันที่
                          </span>
                          <span className="text-right">{statementDate}</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                          <span className="font-semibold text-left">
                            เลขที่
                          </span>
                          <span className="text-right">{documentNo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-[14px]">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold">นามผู้ซื้อ:</span>{" "}
                          {customerName}
                        </div>
                        <div className="opacity-80">
                          ทางบจก. เอส.เอส.ดับบลิว.สตีล เซ็นเตอร์
                          ได้มาวางบิลไว้แก่ท่าน
                          เพื่อให้ท่านได้ตรวจสอบและนัดชำระเงิน
                          ตามรายการดังต่อไปนี้
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="mt-4 flex flex-col gap-2 justify-center items-center">
                      <p className="text-[16px] font-bold">ใบกำกับภาษี</p>
                      <table className="w-full border-collapse text-[15px]">
                        <thead>
                          <tr>
                            <th className="th">ลำดับ</th>
                            <th className="th">วัน เดือน ปี</th>
                            <th className="th">เลขที่</th>
                            <th className="th">จำนวนเงิน</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pageRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="td text-left opacity-70 py-6"
                              >
                                ไม่พบข้อมูล
                              </td>
                            </tr>
                          ) : (
                            pageRows.map((bill, rowIndex) => {
                              const runningIndex =
                                pageIndex * ROWS_PER_PAGE + rowIndex + 1;
                              const dateStr = new Date(
                                bill.createdAt,
                              ).toLocaleDateString("th-TH", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              });

                              return (
                                <tr key={bill.id} className="avoid-break">
                                  <td className="td">{runningIndex}</td>
                                  <td className="td">{dateStr}</td>
                                  <td className="td">
                                    HS{bill.invoiceNo || "-"}
                                  </td>
                                  <td className="td">
                                    {bill.grandTotal.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer (last page only) */}
                    {isLastPage && (
                      <footer className="mt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className=""></div>
                          <div className=""></div>
                          <div className="text-right">
                            <div className="flex">
                              <div className="mt-2">รวมทั้งสิ้น</div>
                              <div className="total-box">
                                {totalAmount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <div className="mt-1 text-[14px] text-left">
                              ({numberToThaiBahtText(totalAmount)})
                            </div>
                          </div>
                          <div className=""></div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-8 grid grid-cols-2 gap-10 text-[14px]">
                          <div className="signature">
                            <div className="label">ผู้รับวางบิล</div>
                            <div className="dots">
                              ....................................................................
                            </div>
                          </div>
                          <div className="signature">
                            <div className="label">ผู้วางบิล</div>
                            <div className="dots">
                              ....................................................................
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-10 text-[14px]">
                          <div className="signature">
                            <div className="label">วันที่รับวางบิล</div>
                            <div className="dots">
                              .....................................................................
                            </div>
                          </div>
                          <div className="signature">
                            <div className="label">วันที่วางบิล</div>
                            <div className="dots">
                              .....................................................................
                            </div>
                          </div>
                        </div>

                        {/* วันนัดชำระเงิน */}
                        <div className="mt-4 grid grid-cols-2 gap-10 text-[14px]">
                          <div className="signature">
                            <div className="label">วันที่นัดชำระเงิน</div>
                            <div className="dots">
                              ....................................................................
                            </div>
                          </div>

                          <div />
                        </div>
                      </footer>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <style jsx global>{`
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              padding: 14mm 10mm;
              box-sizing: border-box;
              margin-bottom: 12px;
            }

            .th,
            .td {
              border: none !important;
              padding: 0px 2px;
              text-align: left !important;
              vertical-align: top;
              white-space: nowrap;
            }

            .th {
              font-weight: 700;
              font-size: 15px;
              padding-bottom: 4px;
            }

            .td {
              font-size: 15px;
            }

            .avoid-break {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .total-box {
              border: 2px solid currentColor;
              padding: 6px 12px;
              min-width: 48mm;
              text-align: right;
              font-weight: 800;
              font-size: 16px;
              letter-spacing: 0.2px;
            }

            .signature .label {
              margin-bottom: 6px;
              font-weight: 600;
            }
            .signature .line {
              border-bottom: 1.5px solid currentColor;
              height: 16px;
            }
            .signature .dots {
              height: 16px;
              letter-spacing: 1px;
            }

            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
              }
              .print\\:hidden {
                display: none !important;
              }
              .a4-page {
                margin: 0;
                page-break-after: always;
                background: #fff !important;
                color: #000 !important;
              }
              .a4-page:last-child {
                page-break-after: auto;
              }
            }
          `}</style>
        </div>
      </DialogContent>
    </Dialog>
  );
}
