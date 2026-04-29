"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UpdateorderIndexPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon wrapper with animation effect */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse dark:bg-red-900/20" />
          <AlertCircle className="relative h-12 w-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ไม่พบรหัสออเดอร์ (Missing Order ID)
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            คุณเข้ามายังหน้านี้โดยไม่ได้ระบุรหัสออเดอร์ <br />
            กรุณาเลือกรายการจากหน้า Dashboard หรือตรวจสอบลิงก์อีกครั้ง
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับสู่หน้าหลัก (Dashboard)
          </Button>
        </div>
      </div>
    </div>
  );
}
