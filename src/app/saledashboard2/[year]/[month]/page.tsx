"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTH_NAMES = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export default function MonthDetailPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const month = params.month as string;

  const monthName = MONTH_NAMES[parseInt(month) - 1];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/saledashboard2")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">
              รายละเอียด {monthName} {year}
            </h1>
            <p className="text-muted-foreground mt-1">
              ข้อมูลรายละเอียดของเดือน {monthName}
            </p>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลเดือน {monthName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-lg">
                กำลังพัฒนาหน้ารายละเอียดสำหรับเดือน {monthName} ปี {year}
              </p>
              <p className="text-muted-foreground">
                หน้านี้จะแสดงข้อมูลรายละเอียดต่างๆ เช่น:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>รายการขายแต่ละรายการ</li>
                <li>รายได้แต่ละประเภท</li>
                <li>รายจ่ายแยกตามหมวดหมู่</li>
                <li>กราฟแสดงแนวโน้ม</li>
                <li>รายงานสรุป</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
