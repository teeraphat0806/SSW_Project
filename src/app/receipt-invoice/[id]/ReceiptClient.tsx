"use client";

import * as React from "react";
import { InvoiceExcelSample } from "@/components/receipt-invoice/InvoiceExcelSample";
import { LoadingScreen } from "@/components/Loading";
import { CuttingMethod } from "@/types";
import { RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [rollbackOpen, setRollbackOpen] = React.useState(false);
  const [rollbackCount, setRollbackCount] = React.useState("1");
  const [rollbackLoading, setRollbackLoading] = React.useState(false);
  const handlePrint = () => {
    window.print();
  };

  const loadReceipt = React.useCallback(() => {
    fetch(`/api/receipt/${id}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  const handlecreateInvocie = async () => {
    if (!data?.poId) return;
    const response = await fetch(`/api/invoice/${data.poId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorText = await response.json();
      toast.error(`สร้าง Invoice ไม่สำเร็จ ${errorText.error}`, {
        position: "bottom-right",
      });
      return;
    }

    toast.success("สร้าง Invoice สำเร็จ", {
      position: "bottom-right",
    });
    window.location.reload();
  };

  const handleRollbackInvoice = async () => {
    const count = Number(rollbackCount);
    if (!count || count < 1 || count > 5) return;

    setRollbackLoading(true);
    try {
      const res = await fetch("/api/invoice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(payload.error || "Rollback Invoice ไม่สำเร็จ", {
          position: "bottom-right",
        });
        return;
      }

      toast.success(payload.message || "Rollback Invoice สำเร็จ", {
        position: "bottom-right",
      });
      setRollbackOpen(false);
      setRollbackCount("1");
      loadReceipt();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดขณะ rollback invoice", {
        position: "bottom-right",
      });
    } finally {
      setRollbackLoading(false);
    }
  };

  React.useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

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
          <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title="Rollback เลข Invoice"
                className="cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rollback เลข Invoice</DialogTitle>
                <DialogDescription>
                  เลือกจำนวน Invoice ล่าสุดที่ต้องการย้อนกลับ (1-5 ใบ)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <span>Invoice ปัจจุบัน</span>
                  <span className="font-semibold">{data.recentlyInvoice}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    จำนวนที่ต้องการ rollback
                  </span>
                  <Select
                    value={rollbackCount}
                    onValueChange={setRollbackCount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกจำนวน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md bg-muted p-3">
                  หลัง rollback {rollbackCount} ใบ เลขล่าสุดจะเป็น
                  <span className="ml-1 font-semibold">
                    {Math.max(
                      (data.recentlyInvoice || 0) - Number(rollbackCount),
                      0,
                    )}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRollbackOpen(false)}
                  disabled={rollbackLoading}
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={() => {
                    const nextInvoice = Math.max(
                      (data.recentlyInvoice || 0) - Number(rollbackCount),
                      0,
                    );
                    const ok = window.confirm(
                      `คุณแน่ใจแล้วใช่ไหม?\nระบบจะ rollback ${rollbackCount} ใบ\nเลข Invoice ล่าสุดจะเปลี่ยนเป็น ${nextInvoice}`,
                    );
                    if (ok) {
                      handleRollbackInvoice();
                    }
                  }}
                  disabled={rollbackLoading}
                >
                  {rollbackLoading ? "กำลัง rollback..." : "ตกลง"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
        date={new Date(data.dateCreateInvoice).toLocaleDateString("th-TH")}
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
