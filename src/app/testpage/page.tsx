// src/app/bill-slip/page.tsx (หรือ [id]/page.tsx ก็ได้)
"use client";

import { InvoiceExcelTable } from "@/components/testpage/InvoiceExcelTable";

type ExcelRow = Record<string, string | number | null | undefined>;

// ตัวอย่างข้อมูลจำลอง (ของจริงให้ fetch จาก API หรือ import จากไฟล์ JSON)
const excelLikeData: ExcelRow[] = [
  {
    Date: "2025-08-01",
    InvoiceNo: "INV100",
    PONumber: "PO-001",
    Customer: "บริษัท A จำกัด",
    SteelCode: "SS400",
    Wide: 10,
    Length: 20,
    Thickness: 1,
    Amount: 5,
    Total: 200,
  },
  {
    Date: "2025-08-01",
    InvoiceNo: "INV100",
    PONumber: "PO-001",
    Customer: "บริษัท A จำกัด",
    SteelCode: "A36",
    Wide: 15,
    Length: 25,
    Thickness: 2,
    Amount: 10,
    Total: 800,
  },
];

export default function BillSlipFromExcelPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6 print:bg-white">
      {/* ปุ่ม print ซ่อนตอนปริ้น */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold">พิมพ์ใบออกบิลจาก Excel</h1>
        <button
          onClick={handlePrint}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Print
        </button>
      </div>

      {/* ส่วนที่เอาไว้ปริ้นจริง */}
      <div
        id="bill-print-area"
        className="mx-auto max-w-5xl rounded-xl bg-white p-4 text-sm text-foreground shadow-md print:shadow-none print:border print:border-black"
      >
        {/* ข้อมูลหัวเอกสาร (จะเอาจาก bill table ก็ได้) */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">SSW Steel Center</h2>
            <p className="text-xs text-muted-foreground">
              ที่อยู่บริษัท / เบอร์โทร / เลขผู้เสียภาษี
            </p>
          </div>
          <div className="text-right text-xs">
            <p>เลขที่เอกสาร: INV100</p>
            <p>วันที่: 01/08/2025</p>
          </div>
        </div>

        {/* ตารางแบบ Excel */}
        <InvoiceExcelTable
          rows={excelLikeData}
          title="รายละเอียดการตัดเหล็ก (รูปแบบจาก Excel)"
        />
      </div>
    </div>
  );
}
