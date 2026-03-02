"use client";

import * as React from "react";
import { InvoiceExcelSample } from "@/components/receipt-invoice/InvoiceExcelSample";
import { LoadingScreen } from "@/components/Loading";
import { CuttingMethod } from "@/types";
type ApiReceipt = {
  poId: number | null;
  invoice: number;
  recentlyInvoice: number;
  dateCreateInvoice: string;
  subtotal: number;
  vat: number;
  grandTotal: number;
  totalTextThai: string;
  selesName: string;
  credit: string;
  poNumber?: string | null;
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
    weight: number | null;
    price: number;
    cuttingMethod?: CuttingMethod;
    job?: string | null;
    total: number;
    isOD?: boolean;
    isServices?: boolean;
    isPerAmount?: boolean;
  }[];
};

export default function ReceiptClient({ id }: { id: string }) {
  const [data, setData] = React.useState<ApiReceipt | null>(null);
  const handlePrint = () => {
    window.print();
  };
  const handlecreateInvocie = () => {
    if (!data?.poId) return;
    fetch(`/api/invoice/${data.poId}`, {
      method: "POST",
    });
    window.location.reload();
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
        <LoadingScreen message="กำลังโหลดใบเสร็จ..." />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-6 print:p-0 print:m-0 print:bg-white print:absolute print:top-0 print:left-0 print:w-full print:z-50">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">ตัวอย่างใบรับเงิน (Receipt)</h1>
        <div className="flex flex-row gap-2 item-center">
          <div
            title="Invoice ล่าสุด"
            className="cursor-help mt-2 flex flex-row gap-1 "
          >
            Invoice ล่าสุด
            <p className="font-bold">{data.recentlyInvoice}</p>
          </div>
          {!data.invoice && (
            <button
              className=" rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700 cursor-pointer"
              onClick={handlecreateInvocie}
            >
              เพิ่ม Invoice
            </button>
          )}{" "}
          <button
            onClick={handlePrint}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent cursor-pointer"
          >
            พิมพ์
          </button>
        </div>
      </div>
      <InvoiceExcelSample
        companyName={data.customer.name}
        addressLine1={data.customer.address}
        addressLine2="" // ถ้าจะแยกค่อย split เพิ่ม
        tel={data.customer.tel}
        fax={data.customer.faxNumber}
        taxId={data.customer.taxNumber}
        invoice={data.invoice}
        date={new Date().toLocaleDateString("th-TH")}
        credit={data.credit}
        selesName={data.selesName}
        poNumber={data.poNumber ?? undefined}
        items={data.steel.map((s) => ({
          steelType: s.steelType,
          thickness: s.thickness,
          width: s.width ?? 0,
          length: s.length,
          job: s.job ?? null,
          amount: s.amount,
          weight: s.weight,
          price: s.price,
          total: s.total,
          cuttingMethod: s.cuttingMethod,
          isOD: s.isOD,
          isServices: s.isServices,
          isPerAmount: s.isPerAmount,
        }))}
        subtotal={data.subtotal}
        vat={data.vat}
        total={data.grandTotal}
        totalTextThai={data.totalTextThai}
      />
    </div>
  );
}
