"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function YearSelector({
  years,
  selectedYear,
  onYearChange,
}: YearSelectorProps) {
  // Convert AD year to Buddhist Era (BE) for display
  const toBuddhistYear = (adYear: number) => adYear + 543;

  return (
    <Select
      value={selectedYear.toString()}
      onValueChange={(value) => onYearChange(Number.parseInt(value))}
    >
      <SelectTrigger className="w-32">
        <SelectValue placeholder="เลือกปี" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {toBuddhistYear(year)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
