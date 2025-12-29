"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { mockCustomers } from "@/lib/saleDashboard/mock-data"
import { ChevronDown } from "lucide-react"

interface CustomerMultiSelectProps {
  selectedCustomerIds: number[]
  onSelectionChange: (ids: number[]) => void
}

export function CustomerMultiSelect({ selectedCustomerIds, onSelectionChange }: CustomerMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = (customerId: number) => {
    const newSelection = selectedCustomerIds.includes(customerId)
      ? selectedCustomerIds.filter((id) => id !== customerId)
      : [...selectedCustomerIds, customerId]

    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedCustomerIds.length === mockCustomers.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(mockCustomers.map((c) => c.id))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between bg-transparent">
          {selectedCustomerIds.length === 0
            ? "เลือกลูกค้า"
            : selectedCustomerIds.length === mockCustomers.length
              ? "ลูกค้าทั้งหมด"
              : `${selectedCustomerIds.length} ลูกค้า`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <Checkbox
              id="select-all"
              checked={selectedCustomerIds.length === mockCustomers.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              เลือกทั้งหมด
            </label>
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {mockCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center gap-2">
                <Checkbox
                  id={`customer-${customer.id}`}
                  checked={selectedCustomerIds.includes(customer.id)}
                  onCheckedChange={() => handleToggle(customer.id)}
                />
                <label htmlFor={`customer-${customer.id}`} className="text-sm cursor-pointer flex-1">
                  {customer.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
