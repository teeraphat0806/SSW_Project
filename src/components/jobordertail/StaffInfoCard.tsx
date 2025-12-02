import React from "react";
import { cn } from "@/lib/utils"; // หรือ path ที่คุณเก็บ utils ไว้
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCog, Wrench, ShieldCheck, Users } from "lucide-react";

export interface StaffInfoCardProps {
  /** รายชื่อหัวหน้างาน */
  supervisorName?: (string | null | undefined)[];
  /** รายชื่อช่าง */
  technicians?: (string | null | undefined)[];
  /** className เสริมจากภายนอก */
  className?: string;
}

/**
 * StaffInfoCard (Enhanced Version)
 * - Modern UI with Avatar placeholders
 * - Color coded sections
 * - Responsive layout
 */
export function StaffInfoCard({
  supervisorName,
  technicians,
  className,
}: StaffInfoCardProps) {
  const supervisors = uniqueAndClean(supervisorName);
  const techs = uniqueAndClean(technicians);

  return (
    <Card
      className={cn(
        "overflow-hidden border-none shadow-md bg-white dark:bg-zinc-900/50 dark:border dark:border-zinc-800",
        className
      )}
    >
      {/* --- Header --- */}
      <div className="border-b bg-background px-6 py-4 ">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Users className="h-5 w-5 text-primary" />
              ทีมงานผู้รับผิดชอบ
            </h3>
            <p className="text-sm text-muted-foreground">
              รายชื่อบุคลากรที่ดูแลจัดการและปฏิบัติงานในออเดอร์นี้
            </p>
          </div>
          <div className="flex gap-2">
            <StatBadge count={supervisors.length} label="หัวหน้า" color="blue" />
            <StatBadge count={techs.length} label="ช่าง" color="orange" />
          </div>
        </div>
      </div>

      {/* --- Content --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x md:divide-y-0 bg-background">
        {/* Supervisors Section */}
        <div className="p-6">
          <SectionHeader
            icon={<ShieldCheck className="h-5 w-5" />}
            title="หัวหน้างาน (Supervisor)"
            colorClass="bg-blue-500 text-white"
          />
          
          <div className="mt-4">
            {supervisors.length === 0 ? (
              <EmptyState text="ยังไม่ได้ระบุหัวหน้างาน" />
            ) : (
              <ScrollArea className="h-full max-h-[200px] pr-4">
                <div className="space-y-3">
                  {supervisors.map((name, idx) => (
                    <PersonItem 
                        key={`sv-${idx}`} 
                        name={name} 
                        role="Supervisor" 
                        avatarColor="bg-blue-500 text-white"
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Technicians Section */}
        <div className="p-6">
          <SectionHeader
            icon={<Wrench className="h-5 w-5" />}
            title="ช่างเทคนิค (Technician)"
            colorClass="bg-orange-500 text-white"
          />

          <div className="mt-4">
            {techs.length === 0 ? (
              <EmptyState text="ยังไม่ได้ระบุช่างรับผิดชอบ" />
            ) : (
              <ScrollArea className="h-full max-h-[200px] pr-4">
                <div className="space-y-3">
                  {techs.map((name, idx) => (
                    <PersonItem 
                        key={`tech-${idx}`} 
                        name={name} 
                        role="Technician" 
                        avatarColor="bg-orange-500 text-white"
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------- Sub-Components -------------------------------- */

const StatBadge = ({ count, label, color }: { count: number, label: string, color: 'blue' | 'orange' }) => {
    const colorStyle = color === 'blue' 
        ? "bg-blue-500 text-white border-blue-800"
        : "bg-orange-500 text-white border-orange-800";
    
    return (
        <div className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors", colorStyle)}>
            <span>{label}</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/80 px-1 text-[10px] font-bold shadow-sm dark:bg-black/20">
                {count}
            </span>
        </div>
    )
}

function SectionHeader({
  icon,
  title,
  colorClass
}: {
  icon: React.ReactNode;
  title: string;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-sm", colorClass)}>
        {icon}
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
    </div>
  );
}

function PersonItem({ name, role, avatarColor }: { name: string, role: string, avatarColor: string }) {
    // ฟังก์ชันสร้างตัวย่อ 2 ตัวแรกของชื่อ
    const getInitials = (n: string) => {
        return n.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
    }

    return (
        <div className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all hover:bg-muted/50 hover:border-border hover:shadow-sm">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarColor)}>
                {getInitials(name)}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{name}</span>
                <span className="text-[11px] text-muted-foreground">{role}</span>
            </div>
        </div>
    )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center bg-muted/20">
      <div className="rounded-full bg-muted/30 p-3 mb-2">
        <Users className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{text}</p>
    </div>
  );
}

/* --------------------------------- Helpers --------------------------------- */

function uniqueAndClean(arr?: (string | null | undefined)[]): string[] {
  if (!Array.isArray(arr)) return [];

  return Array.from(
    new Set(
      arr
        .map((value) => {
          if (typeof value === "string") return value.trim();
          if (typeof value === "number") return String(value).trim();
          return "";
        })
        .filter((s) => s.length > 0)
    )
  );
}