"use client";

import * as React from "react";
import { CuttingMethod } from "@/types";

type InvoiceItem = {
  steelType: string; // SS400
  thickness: number; // 25
  width?: number | null; // 430
  length: number; // 2745
  unit?: string; // mm.
  job: string; // 1
  amount?: number;
  weight: number; // 233.00
  price: number; // 34.00
  total: number; // 7922.00
  cuttingMethod?: CuttingMethod;
  isOD?: boolean;
  isServices?: boolean;
};

type Inv71LikeInvoiceProps = {
  // เธชเนเธงเธเธซเธฑเธงเธเธฃเธดเธฉเธฑเธ—
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  taxId: string;

  // เธชเนเธงเธเน€เธญเธเธชเธฒเธฃเธเธงเธฒเธเธ
  invoice: number; // 1003
  date: string; // 14/08/68
  credit: string; // 30 เธงเธฑเธ
  selesName: string; // J.Sirikran

  // เธฃเธฒเธขเธเธฒเธฃ
  items: InvoiceItem[];

  // เธขเธญเธ”เธฃเธงเธก
  subtotal: number; // 7,922.00
  vat: number; // 554.54
  total: number; // 8,476.54
  totalTextThai: string; // เนเธเธ”เธเธฑเธเธชเธตเนเธฃเนเธญเธขเน€เธเนเธ”เธชเธดเธเธซเธเธเธฒเธ—เธซเนเธฒเธชเธดเธเธชเธตเนเธชเธ•เธฒเธเธเน
};

export const InvoiceExcelCutter: React.FC<Inv71LikeInvoiceProps> = ({
  companyName,
  invoice,
  items,
}) => {
  const rowsPerPage = 5;
  const pages = React.useMemo(() => {
    const chunked: InvoiceItem[][] = [];
    for (let i = 0; i < items.length; i += rowsPerPage) {
      chunked.push(items.slice(i, i + rowsPerPage));
    }
    // Ensure at least one page for consistent layout even when items is empty.
    if (chunked.length === 0) chunked.push([]);
    return chunked;
  }, [items]);

  return (
    <div id="inv71-print-area" className="space-y-10">
      {pages.map((pageItems, pageIdx) => (
        <div
          key={pageIdx}
          className="mx-auto flex h-[14.8cm] w-full max-w-[29.7cm] flex-col bg-white px-10 py-8 text-[24px] text-black print:h-[14.8cm] print:w-[29.7cm]"
          style={{
            pageBreakAfter: pageIdx === pages.length - 1 ? "auto" : "always",
          }}
        >
          <div className="mb-8 flex items-start justify-between">
            <div className="text-4xl font-bold">{companyName}</div>
            <div className="text-right text-4xl font-semibold">
              {invoice ? invoice.toString() : ""}
            </div>
          </div>

          <table className="w-full table-fixed text-[24px] leading-9">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[280px]" />
              <col className="w-[440px]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-black text-left text-[26px] font-semibold">
                <th className="pb-4">ลำดับ</th>
                <th className="pb-4">เกรดเหล็ก</th>
                <th className="pb-4">หนา x กว้าง x ยาว</th>
                <th className="pb-4">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-gray-500" colSpan={4}>
                    -
                  </td>
                </tr>
              ) : (
                pageItems.map((item, idx) => {
                  let steelDisplay =
                    item.isServices === true
                      ? item.steelType
                      : `เหล็ก ${item.steelType}`;
                  let dimensions = "";

                  if (item.isOD) {
                    const odDimensions = [
                      item.thickness !== 0 ? `${item.thickness} t` : null,
                      item.width != null && item.width !== 0
                        ? `OD ${item.width}`
                        : null,
                      item.length !== 0 ? `ID ${item.length}` : null,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    dimensions = `${odDimensions}${odDimensions ? " " : ""}${
                      item.unit || "mm."
                    }`;
                  } else {
                    if (item.cuttingMethod === "FB") {
                      steelDisplay += " F/P";
                    } else if (item.cuttingMethod === "RM") {
                      steelDisplay += " R/M";
                    }

                    if (item.width === 0 || item.width == null) {
                      steelDisplay += " \u00D8";
                      const lineDimensions = [item.thickness, item.length]
                        .filter((value) => value !== 0)
                        .join(" x ");
                      dimensions = `${lineDimensions}${
                        lineDimensions ? " " : ""
                      }${item.unit || "mm."}`;
                    } else {
                      const boxDimensions = [
                        item.thickness,
                        item.width,
                        item.length,
                      ]
                        .filter((value) => value !== 0)
                        .join(" x ");
                      dimensions = `${boxDimensions}${
                        boxDimensions ? " " : ""
                      }${item.unit || "mm."}`;
                    }
                  }

                  if (item.isServices === true) {
                    steelDisplay = `machine services ${steelDisplay}`;
                  }

                  return (
                    <tr
                      key={`${pageIdx}-${idx}`}
                      className="border-b border-dotted border-gray-300 align-top"
                    >
                      <td className="py-4 pr-5 text-left text-[24px] font-semibold">
                        {pageIdx * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-4 pr-5 text-[24px] font-semibold">
                        {steelDisplay}
                      </td>
                      <td className="py-4 pr-5 text-[24px]">{dimensions}</td>
                      <td className="py-4 text-[24px] font-semibold">
                        {item.amount ?? ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="mt-10 flex items-center gap-3 text-[18px] text-gray-700">
            <div className="flex-1 border-t-2 border-dashed border-gray-800" />
            <span className="px-2 font-semibold">ตัดตามเส้นประ (Half A4)</span>
            <div className="flex-1 border-t-2 border-dashed border-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
};

