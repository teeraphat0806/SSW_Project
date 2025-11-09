"use client";
//import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ArrowLeft,
  CircleDashed,
  Scissors,
  Scale,
  CheckCircle2,
  ClipboardCheck,
  Truck,
  PackageCheck, } from "lucide-react";
import { Button } from "../../components/ui/button";
const UpdateOrderPage = () => {
  const router = useRouter();
  return (
    <div className="min-h-screen md:pl-24">
      <div className="min-h-screen w-full bg-background text-foreground">
        {/*Header*/}
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-base font-medium"
              >
                <ArrowLeft className="h-5 w-5" />
                กลับสู่หน้าหลัก
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">อัปเดตคำสั่งซื้อ</h1>
                <p className="text-sm text-neutral-500">
                  Order PO: PO-2025-00123
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Print
            </button>
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Download PDF
            </button>
            <button className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
              Edit Order
            </button>
          </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default UpdateOrderPage;
