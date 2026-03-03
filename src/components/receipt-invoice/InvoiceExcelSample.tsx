"use client";

import * as React from "react";
import { CuttingMethod } from "@/types";

type InvoiceItem = {
  steelType: string; // SS400
  thickness: number; // 25
  width: number; // 430
  length: number; // 2745
  unit?: string; // mm.
  job: string | null; // 1
  amount?: number;
  weight: number | null; // 233.00
  price: number; // 34.00
  total: number; // 7922.00
  cuttingMethod?: CuttingMethod;
  isOD?: boolean; // true สำหรับ OD/ID format
  isServices?: boolean; // true สำหรับบริการ (ย้ายน้ำหนักไป Job)
  isPerAmount?: boolean; // true สำหรับคิดราคาต่อชิ้น
};

type Inv71LikeInvoiceProps = {
  // ส่วนหัวบริษัท
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  taxId: string;

  // ส่วนเอกสารขวาบน
  invoice: number; // 1003
  date: string; // 14/08/68
  credit: string; // 30 วัน
  poNumber?: string; // เลขที่ใบ PO
  selesName: string; // J.Sirikran
  recentlyInvoice?: number;
  dateCreateInvoice?: string;

  // รายการ
  items: InvoiceItem[];

  // ยอดรวม
  subtotal: number; // 7,922.00
  discount?: number; // ส่วนลด
  vat: number; // 554.54
  total: number; // 8,476.54
  totalTextThai: string; // แปดพันสี่ร้อยเจ็ดสิบหกบาทห้าสิบสี่สตางค์
};

export const InvoiceExcelSample: React.FC<Inv71LikeInvoiceProps> = ({
  companyName,
  addressLine1,
  addressLine2,
  tel,
  fax,
  taxId,
  invoice,
  date,
  credit,
  poNumber,
  selesName,
  items,
  subtotal,
  discount,
  vat,
  total,
  totalTextThai,
  recentlyInvoice,
  dateCreateInvoice,
}) => {
  const formatNumber = (n?: number | null) => {
    const x = typeof n === "number" ? n : Number(n);
    return x.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // machine service แสดงยอดได้แม้ weight เป็น 0/null
  // กรณีอื่นคงพฤติกรรมเดิม
  const shouldShowTotals =
    (items?.some((item) => item.isServices === true) ?? false) ||
    !(items?.[0]?.weight == null || items?.[0]?.weight === 0);

  const companyNameTokens = companyName.trim().split(/\s+/).filter(Boolean);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              margin: 0;
              size: A4;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `,
        }}
      />

      <div
        id="inv71-print-area"
        className="
    mx-auto w-full max-w-[21cm]
    h-[29.7cm] print:h-[29.7cm]
    bg-white
    px-4
    pt-[0.2cm]      /* เว้นบน 4 ซม. */
    pb-[7.02cm]      /* เว้นล่าง 5 ซม. */
    text-sm text-black font-light
    flex flex-col
  "
      >
        {/* ระยะห่างด้านบน (ปรับให้แคบลงกว่าของเดิม) */}
        <div className="h-[22mm]" />

        {/* แถวแรก: ซ้ายบริษัท, ขวาเลขที่/วันที่/เครดิต/ผู้จัดทำ */}
        <div className="flex justify-between gap-4">
          {/* ซ้าย: ข้อมูลบริษัท */}
          <div className="space-y-2 max-w-[10cm] ml-13">
            <div className="font-base">
              {companyNameTokens.length > 0
                ? companyNameTokens.map((token, index) => (
                    <React.Fragment key={`${token}-${index}`}>
                      {index > 0 ? " " : ""}
                      <span className="whitespace-nowrap">{token}</span>
                    </React.Fragment>
                  ))
                : companyName}
            </div>
            <div className="mt-1">{addressLine1}</div>
            <div>{addressLine2}</div>
            <div className="mt-1">
              {tel ? `โทร.${tel}` : ""} &nbsp;&nbsp;&nbsp;{" "}
              {fax ? `แฟกซ์ ${fax}` : ""}
            </div>
            <div className="mt-1">เลขประจำตัวผู้เสียภาษี {taxId}</div>
          </div>

          <div className="min-w-[170px] text-sm space-y-3 mr-20 text-center">
            <div>
              <span>
                HS{invoice ? invoice.toString().padStart(8, "0") : ""}
              </span>
            </div>
            <div>
              <span>{date} </span>
            </div>
            <div className="ml-20">
              <span>{credit}&nbsp;วัน</span>
            </div>
            {poNumber ? (
              <div>
                <span>{poNumber}</span>
              </div>
            ) : (
              <div className="h-1"></div>
            )}

            <div>
              <span>{"J.Sirikran"}</span>
            </div>
          </div>
        </div>

        {/* ระยะห่างก่อนหัวคอลัมน์ (ลดลงจาก mt-19) */}
        <div className="h-[25mm]" />

        {/* หัวคอลัมน์แบบ Excel (ไม่มีกรอบ) */}
        <table className="w-full text-sm">
          <colgroup>
            <col className="w-[35px]" />
            <col className="w-[300px]" />
            <col className="w-[100px]" />
            <col className="w-[60px]" />
            <col className="w-[80px]" />
            <col className="w-[80px]" />
            <col className="w-[100px]" />
          </colgroup>

          <thead>
            <tr className="text-center">
              <th className="pb-1 font-normal text-left ">
                <span className="underline opacity-0">ลำดับ</span>
              </th>
              <th className="pb-1 font-normal text-left">
                <div className="flex gap-15">
                  <span className="underline">เกรดเหล็ก </span>
                  <span className="underline">หนา x กว้าง x ยาว</span>
                </div>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline">JOB</span>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline">จำนวน</span>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline"></span>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline"></span>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline"></span>
              </th>
              <th className="pb-1 font-normal text-left">
                <span className="underline"></span>
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, idx) => {
              let steelDisplay = "";

              if (item.isOD) {
                const steelPrefix = item.isServices === true ? "" : "เหล็ก ";
                steelDisplay = `${steelPrefix}${item.steelType} ${item.thickness} t OD ${item.width} ID ${item.length} ${
                  item.unit || "mm."
                }`;
              } else {
                let prefix =
                  item.isServices === true
                    ? item.steelType
                    : `เหล็ก ${item.steelType}`;

                if (item.cuttingMethod === "FB") prefix += " F/P";
                else if (item.cuttingMethod === "RM") prefix += " R/M";

                let dimensions = "";
                if (item.width === 0 || item.width === null) {
                  prefix += " Ø";
                  dimensions = `${item.thickness} x ${item.length} ${item.unit || "mm."}`;
                } else {
                  dimensions = `${item.thickness} x ${item.width} x ${item.length} ${item.unit || "mm."}`;
                }

                const suffix = item.cuttingMethod === "CNC" ? "(แบบ)" : "";
                steelDisplay = `${prefix} ${dimensions}${suffix}`;
              }

              if (item.isServices === true) {
                steelDisplay = `services ${steelDisplay}`;
              }

              let jobDisplay = "";
              if (
                item.isServices === true &&
                item.weight != null &&
                item.weight > 0
              ) {
                jobDisplay = `[${formatNumber(item.weight)} kg]`;
              } else if (item.job) {
                jobDisplay = item.job;
              }

              let weightDisplay = "";
              if (
                item.isServices !== true &&
                item.weight != null &&
                item.weight > 0
              ) {
                weightDisplay = formatNumber(item.weight);
              }

              const showPriceAndTotal = item.isServices === true ? true : true;

              return (
                <tr key={idx} className="align-top">
                  <td className="pt-0.5 pr-1 pl-0">{idx + 1}</td>
                  <td className="pt-0.5 pr-1">{steelDisplay}</td>
                  <td className="pt-0.5 pr-1 text-left pl-1">{jobDisplay}</td>
                  <td className="pt-0.5 pr-1 text-left pl-5">{item.amount}</td>
                  <td className="pt-0.5 pr-1 text-right">{weightDisplay}</td>
                  <td className="pt-0.5 pr-1 text-right pl-5">
                    {showPriceAndTotal ? formatNumber(item.price) : ""}
                  </td>
                  <td className="pt-0.5 pr-0 text-left"></td>
                  <td className="pt-0.5 pr-0 pl-4 text-right">
                    {showPriceAndTotal ? formatNumber(item.total) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ===== โซนรวมยอด (ติดล่างเสมอ) ===== */}
        {/* เอา mb-45 ออก แล้วคุมระยะจากขอบล่างด้วย pb-[8mm] ที่ container แทน */}
        <div className="mt-auto">
          <div className="space-y-[2px] mr-5">
            <div className="flex justify-between">
              <span className="flex-1" />
              <span className="w-[160px] text-right">
                {!shouldShowTotals ? "" : formatNumber(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="flex-1" />
              <span className="w-[160px] text-right">&nbsp;</span>
            </div>

            <div className="flex justify-between">
              <span className="flex-1" />
              <span className="w-[160px] text-right">
                {!shouldShowTotals ? "" : formatNumber(subtotal)}
              </span>
            </div>

            {discount != null && discount > 0 && (
              <div className="flex justify-between">
                <span className="flex-1" />
                <span className="w-[160px] text-right">
                  {formatNumber(discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="flex-1" />
              <span className="w-[150px] text-right">
                {!shouldShowTotals ? "" : formatNumber(vat)}
              </span>
            </div>
          </div>

          <div className="mt-6 flex mr-5">
            <div className="flex-1 ml-10">
              {!shouldShowTotals ? "" : totalTextThai}
            </div>
            <div className="w-[160px] text-right font-semibold">
              {!shouldShowTotals ? "" : formatNumber(total)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
