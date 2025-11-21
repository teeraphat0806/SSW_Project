"use client";

import * as React from "react";
import { InvoiceExcelSample } from "@/components/testpage/InvoiceExcelSample";

export default function Inv71Page() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6 print:bg-white">
      {/* ปุ่ม Print ซ่อนตอนปริ้น */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">
          ตัวอย่างใบงานแบบเดิมจาก Excel (inv71)
        </h1>
        <button
          onClick={handlePrint}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Print
        </button>
      </div>

      <InvoiceExcelSample
        companyName="บริษัท สาสกุล ซัพพลาย อินดัสเตรียล สตีล จำกัด"
        addressLine1="สำนักงานใหญ่ 121/226 หมู่ 11 ต.บางปลา"
        addressLine2="อ.บางพลี จ.สมุทรปราการ 10540"
        tel="0-2750-5689"
        fax="0-2312-9368"
        taxId="0115562018453"
        docNo="HS00127879"
        date="14/08/68"
        credit="30 วัน"
        preparedBy="J.Sirikran"
        items={[
          {
            grade: "SS400",
            thickness: 25,
            width: 430,
            length: 2745,
            unit: "mm.",
            job: "1",
            quantity: 1,
            weight: 233.0,
            pricePerKg: 34.0,
            amount: 7922.0,
          },
          {
            grade: "SUS304",
            thickness: 10,
            width: 200,
            length: 1500,
            unit: "mm.",
            job: "2",
            quantity: 2,
            weight: 75.0,
            pricePerKg: 95.0,
            amount: 7125.0,
          }
        ]}
        subtotal={7922.0}
        taxBase={7922.0}
        vat={554.54}
        total={8476.54}
        totalTextThai="แปดพันสี่ร้อยเจ็ดสิบหกบาทห้าสิบสี่สตางค์"
        accumulateTextThai="หนึ่งแสนสองหมื่นแปดพันสองร้อยเก้าสิบเจ็ดบาทห้าสิบสตางค์"
      />
    </div>
  );
}
