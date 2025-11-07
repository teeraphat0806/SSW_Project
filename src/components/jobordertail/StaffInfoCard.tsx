// Adjust the import paths to match your project structure
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserCog, Wrench } from "lucide-react";
import * as React from "react";

export interface StaffInfoCardProps {
  /** รายชื่อหัวหน้างาน (string หรือ null/undefined จะถูกจัดการให้) */
  supervisorName?: (string | null | undefined)[];
  /** รายชื่อช่าง (string หรือ null/undefined จะถูกจัดการให้) */
  technicians?: (string | null | undefined)[];
  /** className เสริมจากภายนอก */
  className?: string;
}

/**
 * StaffInfoCard
 * - แสดงหัวหน้างานและช่างที่รับผิดชอบในรูปแบบการ์ดเรียบง่าย มืออาชีพ
 * - แสดงเป็น list รายชื่อ ไม่มีกรอบ/Avatar ตามที่ระบุ
 * - ปลอดภัยต่อข้อมูลที่อาจเป็น null / undefined หรือ field หายจาก API
 */
export function StaffInfoCard({
  supervisorName,
  technicians,
  className,
}: StaffInfoCardProps) {
  // ทำให้ข้อมูลสะอาด + ป้องกัน error ทุกเคส
  const supervisors = uniqueAndClean(supervisorName);
  const techs = uniqueAndClean(technicians);

  return (
    <div className="px-5 py-4 space-y-4">
    <Card
      className={cn(
        "rounded-2xl border bg-background shadow-sm",
        "p-5 sm:p-6",
        className
      )}
      aria-label="ข้อมูลผู้รับผิดชอบงาน"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            ข้อมูลผู้รับผิดชอบงาน
          </h3>
          <p className="text-sm text-muted-foreground">
            แสดงหัวหน้างานและช่างที่รับผิดชอบออเดอร์นี้
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Badge variant="secondary" className="rounded-full">
            หัวหน้างาน: {supervisors.length}
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            ช่าง: {techs.length}
          </Badge>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Content */}
      <div className="grid grid-cols-2 gap-1">
        {/* Supervisors */}
        <div className="flex flex-col">
          <SectionHeader
            icon={<UserCog className="h-5 w-5 text-muted-foreground" />}
            title="หัวหน้างาน"
          />

          {supervisors.length === 0 ? (
            <EmptyState text="ยังไม่ได้ระบุหัวหน้างาน" />
          ) : (
            <ScrollArea className="max-h-56 pr-1">
              <ul
                className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside"
                role="list"
              >
                {supervisors.map((name, idx) => (
                  <li key={`sv-${idx}`}>{name}</li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        {/* Technicians */}
        <div className="flex flex-col">
          <SectionHeader
            icon={<Wrench className="h-5 w-5 text-muted-foreground" />}
            title="ช่างรับผิดชอบ"
          />

          {techs.length === 0 ? (
            <EmptyState text="ยังไม่ได้ระบุช่างรับผิดชอบ" />
          ) : (
            <ScrollArea className="max-h-56 pr-1">
              <ul
                className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside"
                role="list"
              >
                {techs.map((name, idx) => (
                  <li key={`tech-${idx}`}>{name}</li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>
    </Card>
    </div>
  );
}

/* --------------------------------- Subparts -------------------------------- */

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-2 rounded-xl border border-dashed bg-muted/20 p-3 text-xs sm:text-sm text-muted-foreground">
      {text}
    </div>
  );
}

/* --------------------------------- Helpers --------------------------------- */

// ✅ ป้องกัน build/runtime error:
// - ถ้า arr ไม่ใช่ array -> คืน []
// - ถ้า element เป็น null/undefined/ว่าง -> ตัดทิ้ง
// - แปลงเป็น string อย่างปลอดภัยก่อน trim
function uniqueAndClean(
  arr?: (string | null | undefined)[]
): string[] {
  if (!Array.isArray(arr)) return [];

  return Array.from(
    new Set(
      arr
        .map((value) => {
          if (typeof value === "string") return value.trim();
          if (typeof value === "number") return String(value).trim();
          return ""; // null / undefined / etc.
        })
        .filter((s) => s.length > 0)
    )
  );
}

/* ---------------------------------- Usage / Tests ---------------------------------- */

// ✅ ปกติ: มีหัวหน้าและช่างครบ
// <StaffInfoCard
//   supervisorName={["สมชาย ใจดี", "ชญาน์ทิพย์ อัครเดช"]}
//   technicians={["วีระพล นาคน้อย", "อนุชา สายธาร", "สุรีย์พร เอี่ยมดี"]}
// />

// ✅ มีค่า null/undefined ปน -> จะถูกกรองออกและไม่ทำให้ build ล้ม
// <StaffInfoCard
//   supervisorName={["สมชาย ใจดี", null, undefined, " "]}
//   technicians={[null, "อนุชา สายธาร", "อนุชา สายธาร"]}
// />

// ✅ ส่งค่ามาผิดเป็น non-array (เช่นมาจาก API ที่แปลก ๆ) -> uniqueAndClean จะกันและคืน []
// (ที่ระดับ TypeScript จะเตือน แต่ runtime ไม่พัง)
// uniqueAndClean("not-array" as any); // []

// ✅ รายชื่อว่างทั้งหมด -> การ์ดแสดงข้อความ empty state ทั้งสองฝั่ง
// <StaffInfoCard supervisorName={[]} technicians={[]} />

// ✅ มีช่องว่าง, ชื่อซ้ำ, และตัวเลข -> จะถูก trim, remove duplicates, แปลงเป็น string
// uniqueAndClean(["  ช่างเอ ", "ช่างเอ", "ช่างบี", 123 as any, null, ""]);
// ผลที่คาดหวัง: ["ช่างเอ", "ช่างบี", "123"]
