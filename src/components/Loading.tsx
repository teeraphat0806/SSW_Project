"use client";

import React from "react";
import { Loader2 } from "lucide-react";

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({
  message = "กำลังโหลดข้อมูล...",
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background/95 z-50">
      <div className="flex flex-col items-center gap-6 p-6">
        {/* Loader2 แบบหมุน */}
        <div className="relative flex items-center justify-center">
          {/* เงาจางๆ ด้านหลังเพิ่มมิติ (Optional) */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transform scale-150 animate-pulse" />

          {/* ตัวไอคอนหลัก */}
          <Loader2
            className="h-16 w-16 text-primary animate-spin"
            strokeWidth={2.5}
          />
        </div>

        {/* ข้อความ */}
        <div className="text-center space-y-2 animate-pulse">
          <h3 className="text-lg font-medium text-foreground">{message}</h3>
          <p className="text-xs text-muted-foreground font-light">
            SSW Steel Center
          </p>
        </div>
      </div>
    </div>
  );
}
