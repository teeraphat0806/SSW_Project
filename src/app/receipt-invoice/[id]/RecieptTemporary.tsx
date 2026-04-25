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
    job?: string | null;
    total: number;
    isOD?: boolean;
    isServices?: boolean;
    isPerAmount?: boolean;
    requiresDimensions: boolean;
    requiredAmount: boolean;
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

export default function ReceiptTemporary({
  id,
  deliveryAddress,
}: {
  id: string;
  deliveryAddress?: string;
}) {
  const [data, setData] = React.useState<ApiReceipt | null>(null);

  const totalAmount = React.useMemo(
    () => data?.steel.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0,
    [data],
  );

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    // Get data from sessionStorage instead of API
    const tempDataStr = sessionStorage.getItem("tempReceiptData");
    if (tempDataStr) {
      try {
        const tempData = JSON.parse(tempDataStr);
        setData(tempData);
        // Clear sessionStorage after use
        sessionStorage.removeItem("tempReceiptData");
      } catch (e) {
        console.error("Failed to parse tempReceiptData:", e);
      }
    }
  }, [id]);

  if (!data)
    return (
      <div>
        <LoadingScreen message="กำลังโหลดใบส่งสินค้า..." />
      </div>
    );

  const formatSteelDisplay = (item: ApiReceipt["steel"][number]) => {
    if (item.requiresDimensions) {
      if (item.isOD) {
        const steelPrefix = item.isServices === true ? "" : "เหล็ก ";
        const idSegment =
          item.length === 0 || !item.length ? "" : ` ID ${item.length}`;
        return `${steelPrefix}${item.steelType} ${item.thickness} t OD ${item.width ?? 0}${idSegment} mm.`;
      }

      let prefix =
        item.isServices === true ? item.steelType : `เหล็ก ${item.steelType}`;

      if (item.cuttingMethod === "FB") prefix += " F/P";
      else if (item.cuttingMethod === "RM") prefix += " R/M";

      let dimensions = "";
      if (item.width === 0 || item.width == null) {
        prefix += " Ø";
        dimensions = `${item.thickness} x ${item.length} mm.`;
      } else {
        dimensions = `${item.thickness} x ${item.width} x ${item.length} mm.`;
      }

      const suffix = item.cuttingMethod === "CNC" ? "(แบบ)" : "";
      let steelDisplay = `${prefix} ${dimensions}${suffix}`;

      if (item.isServices === true) {
        steelDisplay = `services ${steelDisplay}`;
      }

      return steelDisplay;
    } else {
      return item.steelType;
    }
  };

  const totalQuantity = data.steel.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );

  return (
    <div className="min-h-screen mt-5 md:mt-0 lg:mt-0 bg-muted/40 px-4 py-6 text-black print:p-0 print:m-0 print:bg-white print:absolute print:top-0 print:left-0 print:w-full print:z-50 dark:bg-zinc-900 dark:text-zinc-100">
      {/* Print Button */}
      <div className="mb-4 flex items-center justify-between p-4 print:hidden">
        <h1 className="text-lg font-semibold">ใบส่งสินค้าชั่วคราว</h1>
        <button
          onClick={handlePrint}
          className="rounded-lg border border-black px-6 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-zinc-300 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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
        <div className="mt-3 grid grid-cols-[1fr_auto] items-start gap-6 text-xs">
          <div className="leading-5 space-y-1 min-w-0">
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <div className="font-semibold">ลูกค้า</div>
              <span className="break-words">{data.customer.name}</span>
            </div>
            <div className="grid grid-cols-[72px_1fr] gap-2">
              <div className="font-semibold">สถานที่จัดส่ง</div>
              <span className="break-words">
                {deliveryAddress || data.customer.address}
              </span>
            </div>
          </div>
          <div className="space-y-1 justify-self-end">
            <div className="grid grid-cols-[84px_auto] gap-2">
              <span className="font-semibold">วันที่ส่งสินค้า</span>
              <span>
                {new Date(data.deliveryDate).toLocaleDateString("th-TH")}
              </span>
            </div>
            <div className="grid grid-cols-[84px_auto] gap-2">
              <span className="font-semibold">กำหนดชำระเงิน</span>
              <span>{data.credit || ""} วัน</span>
            </div>
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
            </tr>
          </thead>
          <tbody>
            {data.steel.map((item, index) => (
              <tr key={index}>
                <td className="p-1 text-center" style={cellStyle}>
                  {index + 1}
                </td>
                <td className="p-1" style={cellStyle}>
                  {formatSteelDisplay(item)}
                </td>
                <td className="p-1 text-center" style={cellStyle}>
                  {item.amount}
                </td>
                <td className="p-1 text-right" style={cellStyle}>
                  {(item.weight ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 15 - data.steel.length) }).map(
              (_, i) => (
                <tr key={`empty-${i}`} style={{ height: "20px" }}>
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
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end  px-3 py-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">จำนวนทั้งหมด</span>
            <span className="min-w-16 text-right font-semibold">
              {totalAmount.toLocaleString("th-TH")}
            </span>
          </div>
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
