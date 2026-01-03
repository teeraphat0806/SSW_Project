"use client";

import * as React from "react";

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
  youRef: string; // HS00127879
  date: string; // 14/08/68
  credit: string; // 30 วัน
  selesName: string; // J.Sirikran

  // รายการ
  items: InvoiceItem[];

  // ยอดรวม
  subtotal: number; // 7,922.00
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
  youRef,
  date,
  credit,
  selesName,
  items,
  subtotal,
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
    <div
      id="inv71-print-area"
      className="
        mx-auto 
        w-full 
        max-w-[21cm]
        bg-white
        px-4 
        py-3 
        text-[11px]
        text-black
        print:w-[21cm]
      "
    >
      {/* แถวแรก: ซ้ายบริษัท, ขวาเลขที่/วันที่/เครดิต/ผู้จัดทำ */}
      <div className="mt-20" />
      <div className="flex justify-between gap-4">
        {/* ซ้าย: ข้อมูลบริษัท */}
        <div className="space-y-[1px]">
          <div className="font-bold">{companyName}</div>
          <div>{addressLine1}</div>
          <div>{addressLine2}</div>
          <div>
            Tel. {tel} &nbsp;&nbsp;&nbsp; Fax : {fax}
          </div>
          <div>เลขประจำตัวผู้เสียภาษี {taxId}</div>
        </div>

        {/* ขวา: HS เลขที่ / วันที่ / เครดิต / ผู้จัดทำ */}
        <div className="min-w-[170px] text-[11px] space-y-[2px]">
          <div className="flex justify-between">
            <span></span>
            {/* <span>เลขที่</span> */}
            <span className="">{youRef}</span>
          </div>
          <div className="flex justify-between">
            <span></span>
            {/* <span>วันที่</span> */}
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span></span>
            {/* <span>เครดิต</span> */}
            <span>{credit}</span>
          </div>
          <div className="flex justify-between">
            <span></span>
            {/* <span>ผู้จัดทำ</span> */}
            <span>{selesName}</span>
          </div>
        </div>
      </div>

      {/* ระยะห่างเล็กน้อยก่อนหัวคอลัมน์ */}
      <div className="mt-20" />

      {/* หัวคอลัมน์แบบ Excel (ไม่มีกรอบ) */}
      <table className="w-full text-[11px]">
        {/* กำหนดความกว้างแต่ละคอลัมน์ให้ฟีลเหมือน Excel */}
        <colgroup>
          <col className="w-[35px]" /> {/* ลำดับ (ไม่โชว์หัว) */}
          <col className="w-[120px]" /> {/* เกรดเหล็ก */}
          <col className="w-[210px]" /> {/* หนา x กว้าง x ยาว */}
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
            <th className="pb-1 font-normal text-left">
              <span className="underline opacity-0">ลำดับ</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">เกรดเหล็ก</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">หนา x กว้าง x ยาว</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">JOB</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">จำนวน</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">น้ำหนัก</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">ราคา</span>
            </th>
            <th className="pb-1 font-normal text-left">
              <span className="underline">จำนวนเงิน</span>
            </th>
          </tr>
        </thead>

        {/* เนื้อหารายการ ต่อจากหัวคอลัมน์ลงมาเลย */}
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="align-top">
              {/* ลำดับ (โชว์เฉพาะเลข ไม่ต้องมีหัวข้อ) */}
              <td className="pt-1 pr-1">{idx + 1}</td>

              <td className="pt-1 pr-1">{`เหล็ก ${item.steelType}`}</td>

              <td className="pt-1 pr-1">
                {`${item.thickness} x ${item.width} x ${item.length} ${
                  item.unit || "mm."
                }`}
              </td>

              <td className="pt-1 pr-1 text-left">{item.job}</td>

              <td className="pt-1 pr-1 text-left">{item.amount}</td>

              <td className="pt-1 pr-1 text-left">
                {formatNumber(item.weight)}
              </td>

              <td className="pt-1 pr-1 text-left">
                {formatNumber(item.price)}
              </td>

              <td className="pt-1 pr-1 text-left">
                {formatNumber(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* เว้นบรรทัดก่อนโซนรวมยอด */}
      <div className="mt-170" />

      {/* รวมเงิน, ฐานภาษี, VAT, รวมทั้งสิ้น (จัดขวาเหมือนในใบ) */}
      <div className="space-y-[2px]">
        <div className="flex justify-between">
          <span className="flex-1" />
          <span className="w-[160px] text-right">{subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span className="flex-1" />
          <span className="w-[160px] text-right">{formatNumber(vat)}</span>
        </div>
      </div>

      {/* แถว: ข้อความตัวหนังสือ & รวมทั้งสิ้น */}
      <div className="mt-2 flex">
        <div className="flex-1">{totalTextThai}</div>
        <div className="w-[160px] text-right font-semibold">
          {formatNumber(total)}
        </div>
      </div>

      {/* แถว: ยอดสะสม (บรรทัดล่างสุด) */}
      {/* {accumulateTextThai && <div className="mt-1">{accumulateTextThai}</div>} */}
    </div>
  );
};
