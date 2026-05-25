"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type StatementDetailApiResponse = {
  statement: {
    id: number;
    statementNo: number | null;
    customerId: number;
    createdAt: string;
    Customer?: {
      name?: string | null;
      address?: string | null;
      tel?: string | null;
      faxNumber?: string | null;
      taxNumber?: string | null;
    } | null;
    items?: Array<{
      invoice?: {
        id: number;
        invoiceNo: number;
        createdAt: string;
        OrderPO?: {
          bill?: {
            grandTotal?: number | null;
          } | null;
        } | null;
      } | null;
    }>;
  };
  totals?: {
    grandTotal?: number;
  };
};

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

  if (baht > 0) {
    const bahtStr = baht.toString();
    const len = bahtStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(bahtStr[i]);
      const position = len - i - 1;

      if (digit === 0) continue;

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

  if (satang > 0) {
    const satangStr = satang.toString().padStart(2, "0");
    const len = satangStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(satangStr[i]);
      const position = len - i - 1;

      if (digit === 0) continue;

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

type PrintInvoice = {
  id: number;
  invoiceNo: number;
  grandTotal: number;
  createdAt: string;
};

function renderThaiWordAtomicText(
  text: string,
  preserveLineBreaks = false,
): ReactNode[] {
  const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter("th", { granularity: "word" })
      : null;

  const lines = preserveLineBreaks ? text.split(/\r?\n/) : [text];

  return lines.flatMap((line, lineIndex) => {
    const nodes: ReactNode[] = [];
    const tokens = line.match(/\([^()]*\)|\s+|[^\s()]+|[()]/g) ?? [line];

    let tokenIndex = 0;
    for (const token of tokens) {
      if (token === "") continue;

      if (/^\s+$/.test(token)) {
        nodes.push(token);
        continue;
      }

      if (/^\([^()]*\)$/.test(token)) {
        nodes.push(
          <span
            key={`${lineIndex}-${tokenIndex++}`}
            className="inline-block whitespace-nowrap"
          >
            {token}
          </span>,
        );
        continue;
      }

      if (segmenter) {
        for (const part of segmenter.segment(token)) {
          if (part.segment === "") continue;

          nodes.push(
            <span
              key={`${lineIndex}-${tokenIndex++}`}
              className="inline-block whitespace-nowrap"
            >
              {part.segment}
            </span>,
          );
        }
      } else {
        nodes.push(
          <span
            key={`${lineIndex}-${tokenIndex++}`}
            className="inline-block whitespace-nowrap"
          >
            {token}
          </span>,
        );
      }
    }

    if (preserveLineBreaks && lineIndex < lines.length - 1) {
      nodes.push(<br key={`br-${lineIndex}`} />);
    }

    return nodes;
  });
}

const ITEMS_PER_PAGE = 12;

export default function StatementPrintPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const statementId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTel, setCustomerTel] = useState("");
  const [customerFax, setCustomerFax] = useState("");
  const [customerTaxNumber, setCustomerTaxNumber] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [currentStatementNo, setCurrentStatementNo] = useState<number | null>(
    null,
  );
  const [nextStatementNo, setNextStatementNo] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<PrintInvoice[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const fetchNextStatementNo = useCallback(async () => {
    try {
      const res = await fetch("/api/statement?limit=1&page=1", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: { nextStatementNo?: number } = await res.json();
      if (typeof data.nextStatementNo === "number") {
        setNextStatementNo(data.nextStatementNo);
      }
    } catch {
      // noop
    }
  }, []);

  const fetchStatement = useCallback(async () => {
    if (!statementId || Number.isNaN(statementId)) {
      setError("Invalid statement id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/statement/${statementId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch statement");

      const data: StatementDetailApiResponse = await res.json();
      const st = data.statement;
      const items = st.items ?? [];

      setCurrentStatementNo(st.statementNo ?? null);
      setCustomerName(st.Customer?.name ?? "-");
      setCustomerAddress(st.Customer?.address ?? "-");
      setCustomerTel(st.Customer?.tel ?? "");
      setCustomerFax(st.Customer?.faxNumber ?? "");
      setCustomerTaxNumber(st.Customer?.taxNumber ?? "");
      setCreatedAt(st.createdAt);
      setInvoices(
        items
          .map((item) => item.invoice)
          .filter((inv): inv is NonNullable<typeof inv> => Boolean(inv))
          .map((inv) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            createdAt: inv.createdAt,
            grandTotal: Number(inv.OrderPO?.bill?.grandTotal ?? 0),
          })),
      );
      setTotalAmount(Number(data.totals?.grandTotal ?? 0));

      if (st.statementNo === null) {
        void fetchNextStatementNo();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [statementId, fetchNextStatementNo]);

  useEffect(() => {
    void fetchStatement();
  }, [fetchStatement]);

  const handleAssignStatementNumber = async () => {
    if (!statementId || assigning || currentStatementNo !== null) return;

    setAssigning(true);
    try {
      const res = await fetch("/api/statement/assign-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to assign statement number");
      }

      await fetchStatement();
    } catch (err) {
      alert(err instanceof Error ? err.message : "กำหนดเลขไม่สำเร็จ");
    } finally {
      setAssigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const thaiShortDate = createdAt
    ? new Date(createdAt).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "-";

  const documentNo =
    currentStatementNo !== null
      ? `${currentStatementNo.toString()}`
      : "ยังไม่กำหนดเลข";

  const customerContactLine = [
    customerTel ? `โทร. ${customerTel}` : "",
    customerFax ? `แฟกซ์ ${customerFax}` : "",
  ]
    .filter(Boolean)
    .join("   ");

  const customerTaxLine = customerTaxNumber
    ? `เลขประจำตัวผู้เสียภาษี ${customerTaxNumber}`
    : "";

  const pages = useMemo(() => {
    if (invoices.length === 0) return [[]] as PrintInvoice[][];
    const out: PrintInvoice[][] = [];
    for (let i = 0; i < invoices.length; i += ITEMS_PER_PAGE) {
      out.push(invoices.slice(i, i + ITEMS_PER_PAGE));
    }
    return out;
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white print:bg-white">
      <div className="print:hidden fixed top-20 md:top-4 right-4 z-30 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          ย้อนกลับ
        </Button>
        {currentStatementNo === null ? (
          <span className="hidden sm:inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/20 dark:text-blue-300">
            เลขถัดไปที่ระบบจะกำหนด: HS{nextStatementNo ?? "-"}
          </span>
        ) : null}
        {currentStatementNo === null ? (
          <Button
            size="sm"
            onClick={handleAssignStatementNumber}
            disabled={assigning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {assigning ? "กำลังกำหนด..." : "กำหนดเลข"}
          </Button>
        ) : null}
        <Button
          size="sm"
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={currentStatementNo === null}
        >
          <Printer className="h-4 w-4 mr-2" />
          พิมพ์งาน
        </Button>
      </div>

      {pages.map((pageData, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const startIndex = pageIndex * ITEMS_PER_PAGE;

        return (
          <div
            key={pageIndex}
            className="page-container"
            style={{ pageBreakAfter: isLastPage ? "auto" : "always" }}
          >
            <div className="page-content">
              <div className="mb-6 mt-11">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-left" />
                  <div className="text-right text-base text-black dark:text-white print:text-black">
                    <p>
                      Page {pageIndex + 1}/{pages.length}
                    </p>
                  </div>
                </div>

                <div className="mb-4 w-full">
                  <div className="grid grid-cols-12 gap-4 ml-3">
                    
                   
                    <div className="col-span-8 ml-10"> 
                      <p className="text-sm font-medium text-black dark:text-white print:text-black whitespace-normal">
                        {renderThaiWordAtomicText(customerName)}
                      </p>
                      <p className="mt-1 text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed">
                        {renderThaiWordAtomicText(customerAddress, true)}
                      </p>
                      {(customerContactLine || customerTaxLine) && (
                        <div className="mt-1 text-sm text-black dark:text-white print:text-black whitespace-pre-wrap leading-relaxed">
                          {customerContactLine ? (
                            <p>{customerContactLine}</p>
                          ) : null}
                          {customerTaxLine ? <p>{customerTaxLine}</p> : null}
                        </div>
                      )}
                    </div>

                   
                    <div className="col-span-4 flex justify-end items-start mt-4">
                      <div className="text-right text-lg flex flex-col gap-10 text-black dark:text-white print:text-black">
                        <p className="font-bold">{documentNo}</p>
                        <p>{thaiShortDate}</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <table className="w-full bill-table mt-11">
                <tbody>
                  {pageData.map((invoice, index) => (
                    <tr key={invoice.id}>
                      <td
                        className="px-0 py-1 text-lg text-left text-black dark:text-white print:text-black"
                        style={{ width: "5%" }}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td
                        className="px-2 py-1 text-lg text-left text-black dark:text-white print:text-black"
                        style={{ width: "18%" }}
                      >
                        HS
                        {invoice.invoiceNo
                          ? String(invoice.invoiceNo).padStart(8, "0")
                          : "-"}
                      </td>
                      <td
                        className="px-2 py-1 text-lg text-center text-black dark:text-white print:text-black"
                        style={{ width: "30%" }}
                      >
                        {new Date(invoice.createdAt).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          },
                        )}
                      </td>
                      <td
                        className="px-0 py-1 text-lg text-right text-black dark:text-white print:text-black"
                        style={{ width: "17%" }}
                      >
                        {invoice.grandTotal.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="fixed-footer mb-[260px]">
                {isLastPage ? (
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold text-black dark:text-white print:text-black print:-ml-[0.8cm]">
                      {numberToThaiText(totalAmount)}
                    </div>
                    <div className="text-xl font-bold text-black dark:text-white print:text-black">
                      ฿{totalAmount.toLocaleString("en-US")}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end items-center">
                    <p className="text-xl italic text-black dark:text-white print:text-black">
                      continue...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

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
            padding-bottom: 30mm;
            min-height: 277mm;
          }

          .fixed-footer {
            position: absolute;
            bottom: 3mm;
            left: 0;
            right: 0;
            padding: 0 10mm;
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
            bottom: 3mm;
            left: 0;
            right: 0;
            padding: 0 10mm;
          }

          .bill-table {
            width: 100%;
            border-collapse: collapse;
          }
        }

        @media screen {
          .dark .page-container {
            background: rgb(24 24 27);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </div>
  );
}
