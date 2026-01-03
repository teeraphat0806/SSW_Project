"use client";

import * as React from "react";
import { InvoiceExcelSample } from "@/components/testpage/InvoiceExcelSample";

type ApiReceipt = {
  yourRef: string;
  subtotal: number;
  vat: number;
  grandTotal: number;
  totalTextThai: string;
  selesName: string;
  credit: string;
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
    total: number;
  }[];
};

export default function ReceiptClient({ id }: { id: string }) {
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

  if (!data) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6 print:bg-white">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">ตัวอย่างใบรับเงิน (Receipt)</h1>
        <button
          onClick={handlePrint}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Print
        </button>
      </div>
      <InvoiceExcelSample
        companyName={data.customer.name}
        addressLine1={data.customer.address}
        addressLine2="" // ถ้าจะแยกค่อย split เพิ่ม
        tel={data.customer.tel}
        fax={data.customer.faxNumber}
        taxId={data.customer.taxNumber}
        youRef={data.yourRef}
        date={new Date().toLocaleDateString("th-TH")}
        credit={data.credit}
        selesName={data.selesName}
        items={data.steel.map((s) => ({
          steelType: s.steelType,
          thickness: s.thickness,
          width: s.width ?? 0,
          length: s.length,
          job: "-", // API ไม่มี job → ใส่ default
          amount: s.amount,
          weight: s.weight,
          price: s.price,
          total: s.total,
        }))}
        subtotal={data.subtotal}
        vat={data.vat}
        total={data.grandTotal}
        totalTextThai={data.totalTextThai}
      />
    </div>
  );
}
