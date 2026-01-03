"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YearSelectorProps {
  years: number[]
  selectedYear: number
  onYearChange: (year: number) => void
}

export function YearSelector({ years, selectedYear, onYearChange }: YearSelectorProps) {
  return (
    <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(Number.parseInt(value))}>
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
  )
}
