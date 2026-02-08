"use client";

import * as React from "react";
import { CuttingMethod } from "@/types";

type InvoiceItem = {
  steelType: string; // SS400
  thickness: number; // 25
  width: number; // 430
  length: number; // 2745
  unit?: string; // mm.
  job: string; // 1
  amount?: number;
  weight: number; // 233.00
  price: number; // 34.00
  total: number; // 7922.00
  cuttingMethod?: CuttingMethod;
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
  invoiceNo: number; // 1003
  date: string; // 14/08/68
  credit: string; // 30 วัน
  poNumber?: string; // เลขที่ใบ PO
  selesName: string; // J.Sirikran

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
  invoiceNo,
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
}) => {
  const formatNumber = (n?: number | null) => {
    const x = typeof n === "number" ? n : Number(n);
    // if (!Number.isFinite(x)) return "0.00";
    return x.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  console.log("items in InvoiceExcelSample:", items);

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
        mx-auto 
        w-full 
        max-w-[21cm]
        min-h-[29.7cm]
        bg-white
        px-4 
        py-3 
        pb-8
        text-sm
        text-black
        font-light
        print:w-[21cm]
        print:min-h-[29.7cm]
        flex
        flex-col
      "
      >
        {/* แถวแรก: ซ้ายบริษัท, ขวาเลขที่/วันที่/เครดิต/ผู้จัดทำ */}
        <div className="mt-19" />
        <div className="flex justify-between gap-4">
          {/* ซ้าย: ข้อมูลบริษัท */}
          <div className="space-y-2 max-w-[8cm] ml-13">
            <div className="font-base">{companyName}</div>
            <div className="mt-1">{addressLine1}</div>
            <div>{addressLine2}</div>
            <div className="mt-1">
              โทร.{tel} &nbsp;&nbsp;&nbsp; แฟกซ์.{fax}
            </div>
            <div className="mt-1">เลขประจำตัวผู้เสียภาษี {taxId}</div>
          </div>

          <div className="min-w-[170px] text-sm space-y-3 mr-20 text-center">
            <div className="">
              <span className="">HS{invoiceNo}</span>
            </div>
            <div className="">
              <span className="">{date} </span>
            </div>
            <div className="ml-20">
              <span className="">{credit}&nbsp;วัน</span>
            </div>
            <div className="">
              <span className="">{poNumber || "0"}</span>
            </div>
            <div className="">
              <span className="">J.Sirikran</span>
            </div>
          </div>
        </div>

        {/* ระยะห่างเล็กน้อยก่อนหัวคอลัมน์ */}
        <div className="mt-19" />

        {/* หัวคอลัมน์แบบ Excel (ไม่มีกรอบ) */}
        <table className="w-full text-sm">
          {/* กำหนดความกว้างแต่ละคอลัมน์ให้ฟีลเหมือน Excel */}
          <colgroup>
            <col className="w-[35px]" /> {/* ลำดับ (ไม่โชว์หัว) */}
            <col className="w-[330px]" /> {/* เกรดเหล็ก + หนา x กว้าง x ยาว */}
            <col className="w-[50px]" /> {/* JOB */}
            <col className="w-[60px]" /> {/* จำนวน */}
            <col className="w-[80px]" /> {/* น้ำหนัก */}
            <col className="w-[80px]" /> {/* ราคา */}
            <col className="w-[100px]" /> {/* จำนวนเงิน */}
          </colgroup>

          {/* หัวคอลัมน์ มีเส้นใต้ ไม่มีกรอบรอบตาราง */}
          <thead>
            <tr className="text-center">
              {/* ลำดับ: มีคอลัมน์แต่ไม่โชว์ข้อความ */}
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

          {/* เนื้อหารายการ ต่อจากหัวคอลัมน์ลงมาเลย */}
          <tbody>
            {items.map((item, idx) => {
              // Format steel type with F/P if cuttingMethod is FB
              let steelTypeDisplay = `เหล็ก ${item.steelType}`;
              if (item.cuttingMethod === "FB") {
                steelTypeDisplay += " F/P";
              }
              // Add @ symbol if width is 0 or null (เพลา/line shape)
              if (item.width === 0 || item.width === null) {
                steelTypeDisplay += " @";
              }

              // Format dimensions based on cutting method
              let dimensionsDisplay;
              if (item.cuttingMethod === "RM") {
                // For circular cutting: use t OD and ID format
                dimensionsDisplay = `${item.thickness} t OD ${item.width} ID ${item.length} ${item.unit || "mm."}`;
              } else {
                // Normal format: thickness x width x length
                dimensionsDisplay = `${item.thickness} x ${item.width} x ${item.length} ${item.unit || "mm."}`;
              }

              return (
                <tr key={idx} className="align-top">
                  {/* ลำดับ (โชว์เฉพาะเลข ไม่ต้องมีหัวข้อ) */}
                  <td className="pt-0.5 pr-1 pl-2">{idx + 1}</td>

                  <td className="pt-0.5 pr-1">
                    {steelTypeDisplay} {dimensionsDisplay}
                  </td>

                  <td className="pt-0.5 pr-1 text-left pl-5">{item.job}</td>

                  <td className="pt-0.5 pr-1 text-left pl-5">{item.amount}</td>

                  <td className="pt-0.5 pr-1 text-left">
                    {item.weight == null || item.weight === 0
                      ? ""
                      : formatNumber(item.weight)}
                  </td>

                  <td className="pt-0.5 pr-1 text-left pl-5">
                    {item.weight == null || item.weight === 0
                      ? ""
                      : formatNumber(item.price)}
                  </td>
                  <td className="pt-0.5 pr-0 text-left">
                    {/* ส่วนลด คอลัมน์นี้เว้นว่าง */}
                  </td>

                  <td className="pt-0.5 pr-8 pl-4 text-left">
                    {item.weight == null || item.weight === 0
                      ? ""
                      : formatNumber(item.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* เว้นบรรทัดก่อนโซนรวมยอด */}
        <div className="h-[39mm] shrink-0 " />

        {/* รวมเงิน, ส่วนลด, ภาษี, VAT, รวมทั้งสิ้น (จัดขวาเหมือนในใบ) */}
        <div className="space-y-[2px] mr-5">
          <div className="flex justify-between">
            <span className="flex-1" />
            <span className="w-[160px] text-right">
              {items[0].weight == null || items[0].weight === 0
                ? ""
                : formatNumber(subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="flex-1" />
            <span className="w-[160px] text-right">&nbsp; </span>
          </div>
          <div className="flex justify-between">
            <span className="flex-1" />
            <span className="w-[160px] text-right">
              {items[0].weight == null || items[0].weight === 0
                ? ""
                : formatNumber(subtotal)}
            </span>
          </div>

          {/* ส่วนลด */}
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
              {items[0].weight == null || items[0].weight === 0
                ? ""
                : formatNumber(vat)}
            </span>
          </div>
        </div>

        {/* แถว: ข้อความตัวหนังสือ & รวมทั้งสิ้น */}
        <div className="mt-6 flex mr-5">
          <div className="flex-1 ml-10">
            {items[0].weight == null || items[0].weight === 0
              ? ""
              : totalTextThai}
          </div>
          <div className="w-[160px] text-right font-semibold">
            {items[0].weight == null || items[0].weight === 0
              ? ""
              : formatNumber(total)}
          </div>
        </div>
      </div>
    </>
  );
};
