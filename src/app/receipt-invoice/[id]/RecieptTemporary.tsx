"use client";

import * as React from "react";
import { LoadingScreen } from "@/components/Loading";
import { CuttingMethod } from "@/types";

type ApiReceipt = {
  invoiceNo: number;
  subtotal: number;
  vat: number;
  grandTotal: number;
  totalTextThai: string;
  selesName: string;
  credit: string;
  deliveryDate: string;
  createdAt: string;
  customer: {
    name: string;
    address: string;
    taxNumber: string;
    tel: string;
    faxNumber: string;
  };
  steel: {
    steelType: string;
    thickness: number;
    width?: number;
    length: number;
    amount: number;
    weight: number;
    price: number;
    cuttingMethod?: CuttingMethod;
    job?: number | null;
    total: number;
  }[];
};

const cellStyle = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "0",
  borderBottom: "0",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as React.CSSProperties;

const headerCellStyle = {
  border: "1px solid #000",
  borderBottom: "0",
  backgroundColor: "#f6e7d6",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as React.CSSProperties;

const lastRowCellStyle = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "0",
  borderBottom: "1px solid #000",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as React.CSSProperties;

export default function ReceiptTemporary({ id }: { id: string }) {
  const [data, setData] = React.useState<ApiReceipt | null>(null);

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    fetch(`/api/receipt/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data)
    return (
      <div>
        <LoadingScreen message="กำลังโหลดใบส่งสินค้า..." />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6 text-black print:p-0 print:m-0 print:bg-white print:absolute print:top-0 print:left-0 print:w-full print:z-50 dark:bg-zinc-900 dark:text-zinc-100">
      {/* Print Button */}
      <div className="mb-4 flex items-center justify-between p-4 print:hidden">
        <h1 className="text-lg font-semibold">ใบส่งสินค้าชั่วคราว</h1>
        <button
          onClick={handlePrint}
          className="rounded-lg border border-black px-6 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-zinc-300 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          พิมพ์
        </button>
      </div>

      {/* A4 Page */}
      <div
        className="mx-auto bg-white text-black shadow-lg print:shadow-none dark:bg-white dark:text-black print-a4 print-force-color print-black-borders print:mx-0"
        style={{ width: "210mm", minHeight: "297mm", padding: "12mm" }}
      >
        {/* Page Number */}
        <div className="text-right text-xs">Page : 1</div>

        {/* Header */}
        <div className="text-center mt-1">
          <div className="text-2xl font-medium">
            บริษัท เอส เอส ดับบิวเอส.สตีลเซ็นเตอร์ จำกัด
          </div>
          <div
            className="mt-1 inline-block bg-[#f6e7d6] px-20 py-0.5 text-2xl font-medium"
            style={
              {
                backgroundColor: "#f6e7d6",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              } as React.CSSProperties
            }
          >
            ใบส่งสินค้าชั่วคราว
          </div>
        </div>

        {/* Customer + Invoice Row */}
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div className="leading-5">
            <div className="flex gap-20">
              <div className="font-semibold">ลูกค้า</div>
              <span>{data.customer.name}</span>
            </div>
            <div className="flex gap-11">
              <div className="font-semibold">สถานที่จัดส่ง</div>
              <span>{data.customer.address}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex gap-20">
              <span className="font-semibold">เลขที่</span>
              <span>{data.invoiceNo}</span>
            </div>
            <div className="flex gap-20">
              <span className="font-semibold">วันที่</span>
              <span>
                {new Date(data.deliveryDate).toLocaleDateString("th-TH")}
              </span>
            </div>
          </div>
        </div>

        {/* Order Info Table */}
        <div
          className="mt-2 border border-black"
          style={
            {
              border: "1px solid #000",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            } as React.CSSProperties
          }
        >
          <div className="grid grid-cols-4 text-[11px]">
            <div
              className="border-r border-black px-2 py-1 text-center font-semibold"
              style={{ borderRight: "1px solid #000" }}
            >
              เลขที่ใบสั่งซื้อ
              <div className="text-[9px] font-normal">ORDER NO.</div>
            </div>
            <div
              className="border-r border-black px-2 py-1 text-center font-semibold"
              style={{ borderRight: "1px solid #000" }}
            >
              วันที่ส่งสินค้า
              <div className="text-[9px] font-normal">ORDER DATE</div>
            </div>
            <div
              className="border-r border-black px-2 py-1 text-center font-semibold"
              style={{ borderRight: "1px solid #000" }}
            >
              กำหนดชำระเงิน
              <div className="text-[9px] font-normal">TERM</div>
            </div>
            <div className="px-2 py-1 text-center font-semibold">
              วันที่ครบกำหนดชำระเงิน
              <div className="text-[9px] font-normal">DUEDATE</div>
            </div>
          </div>
          <div className="grid grid-cols-4 text-[11px]">
            <div
              className="border-t border-r border-black px-2 py-1 text-center"
              style={{
                borderTop: "1px solid #000",
                borderRight: "1px solid #000",
              }}
            >
              {data.invoiceNo}
            </div>
            <div
              className="border-t border-r border-black px-2 py-1 text-center"
              style={{
                borderTop: "1px solid #000",
                borderRight: "1px solid #000",
              }}
            >
              {new Date(data.deliveryDate).toLocaleDateString("th-TH")}
            </div>
            <div
              className="border-t border-r border-black px-2 py-1 text-center"
              style={{
                borderTop: "1px solid #000",
                borderRight: "1px solid #000",
              }}
            >
              {data.credit || "30"}
            </div>
            <div
              className="border-t border-black px-2 py-1 text-center"
              style={{ borderTop: "1px solid #000" }}
            ></div>
          </div>
        </div>

        {/* Items Table */}
        <table
          className="w-full border-collapse border border-black text-[11px]"
          style={
            {
              borderCollapse: "collapse",
              border: "1px solid #000",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
              colorAdjust: "exact",
            } as React.CSSProperties
          }
        >
          <thead>
            <tr>
              <th className="p-1 text-center w-12" style={headerCellStyle}>
                NO.
              </th>
              <th className="p-1 text-center" style={headerCellStyle}>
                รายการ
                <div className="text-[9px] font-normal">DESCRIPTION</div>
              </th>
              <th className="p-1 text-center w-16" style={headerCellStyle}>
                จำนวน
                <div className="text-[9px] font-normal">QUANTITY</div>
              </th>
              <th className="p-1 text-center w-20" style={headerCellStyle}>
                น้ำหนัก
                <div className="text-[9px] font-normal">WEIGHT</div>
              </th>
              <th className="p-1 text-center w-20" style={headerCellStyle}>
                ราคา/หน่วย
                <div className="text-[9px] font-normal">PRICE/UNIT</div>
              </th>
              <th className="p-1 text-center w-20" style={headerCellStyle}>
                จำนวนเงิน
                <div className="text-[9px] font-normal">AMOUNT</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.steel.map((item, index) => (
              <tr key={index}>
                <td className="p-1 text-center" style={cellStyle}>
                  {index + 1}
                </td>
                <td className="p-1" style={cellStyle}>
                  เหล็ก {item.steelType} &nbsp;&nbsp;&nbsp; {item.thickness} x{" "}
                  {item.width || 0} x {item.length} mm.
                </td>
                <td className="p-1 text-center" style={cellStyle}>
                  {item.amount}
                </td>
                <td className="p-1 text-right" style={cellStyle}>
                  {(item.weight ?? 0).toFixed(2)}
                </td>
                <td className="p-1 text-right" style={cellStyle}></td>
                <td className="p-1 text-right" style={cellStyle}></td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - data.steel.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`} style={{ height: "20px" }}>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                  <td style={cellStyle}></td>
                </tr>
              ),
            )}
            <tr style={{ height: "0px" }}>
              <td style={lastRowCellStyle}></td>
              <td style={lastRowCellStyle}></td>
              <td style={lastRowCellStyle}></td>
              <td style={lastRowCellStyle}></td>
              <td style={lastRowCellStyle}></td>
              <td style={lastRowCellStyle}></td>
            </tr>
          </tbody>
        </table>

        {/* Summary Box (Right) */}
        <div className="flex justify-end">
          <table
            className="border-collapse text-[11px] w-[180px]"
            style={
              {
                borderCollapse: "collapse",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              } as React.CSSProperties
            }
          >
            <tbody>
              <tr>
                <td className="px-2 py-0.5">รวมยอดเงิน</td>
                <td
                  className="px-2 py-0.5 text-right"
                  style={{ border: "1px solid #000" }}
                >
                  -
                </td>
              </tr>
              <tr>
                <td className="px-2 py-0.5">หัก ส่วนลด</td>
                <td
                  className="px-2 py-0.5 text-right"
                  style={{ border: "1px solid #000" }}
                >
                  -
                </td>
              </tr>
              <tr>
                <td className="px-2 py-0.5">ยอดเงินหลังหักส่วนลด</td>
                <td
                  className="px-2 py-0.5 text-right"
                  style={{ border: "1px solid #000" }}
                >
                  -
                </td>
              </tr>
              <tr>
                <td className="px-2 py-0.5">ภาษีมูลค่าเพิ่ม</td>
                <td
                  className="px-2 py-0.5 text-right"
                  style={{ border: "1px solid #000" }}
                >
                  0.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="mt-6 grid grid-cols-2 gap-8 text-[11px]">
          <div className="text-center">
            <div className="mb-6">
              ผู้รับของ ....................................
            </div>
            <div>วันที่ ....................................</div>
          </div>
          <div className="text-center">
            <div className="mb-6">
              ผู้ส่งของ ....................................
            </div>
            <div>วันที่ ....................................</div>
          </div>
        </div>
      </div>
    </div>
  );
}
