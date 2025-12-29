"use client"

import { useState } from "react"
import { YearOverviewPanel } from "./year-overview-panel"
import { MonthDashboardPanel } from "./month-dashboard-panel"

interface SalesDashboardProps {
  year: number
}

export function SalesDashboard({ year }: SalesDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(1)

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month)
    // Scroll to month dashboard section
    const element = document.getElementById("month-dashboard")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-8">
      {/* Year Overview Section */}
      <section>
        <YearOverviewPanel year={year} onMonthSelect={handleMonthSelect} />
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Month Dashboard Section */}
      <section id="month-dashboard">
        <MonthDashboardPanel year={year} initialMonth={selectedMonth} key={selectedMonth} />
      </section>
    </div>
  )
}
