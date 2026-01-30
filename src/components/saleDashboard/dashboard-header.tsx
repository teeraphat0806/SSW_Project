"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  title?: string;
  description?: string;
}

export function DashboardHeader({
  selectedYear,
  onYearChange,
  title = "Dashboard",
  description = "ภาพรวมข้อมูลสำคัญของธุรกิจ",
}: DashboardHeaderProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">เลือกปี:</label>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => onYearChange(Number(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="เลือกปี" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
