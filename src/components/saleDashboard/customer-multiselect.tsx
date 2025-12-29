"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomers } from "@/hooks/saleDashboard/useSaleDashboardData";
import { ChevronDown } from "lucide-react";

interface CustomerMultiSelectProps {
  selectedCustomerIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function CustomerMultiSelect({
  selectedCustomerIds,
  onSelectionChange,
}: CustomerMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { customers, loading, error } = useCustomers();

  const allIds = useMemo(() => customers.map((c) => c.id), [customers]);
  const allCount = customers.length;

  const allSelected =
    selectedCustomerIds.length > 0 && selectedCustomerIds.length === allCount;

  const handleToggle = (customerId: number) => {
    const newSelection = selectedCustomerIds.includes(customerId)
      ? selectedCustomerIds.filter((id) => id !== customerId)
      : [...selectedCustomerIds, customerId];

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allIds);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-between bg-transparent"
          disabled={loading}
        >
          {loading
            ? "กำลังโหลดลูกค้า..."
            : error
            ? "ใช้ข้อมูลสำรอง"
            : selectedCustomerIds.length === 0
            ? "เลือกลูกค้า"
            : allSelected
            ? "ลูกค้าทั้งหมด"
            : `${selectedCustomerIds.length} ลูกค้า`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-3">
          {error && (
            <p className="text-sm text-red-600">ใช้ข้อมูลสำรอง: {error}</p>
          )}
          <div className="flex items-center gap-2 border-b pb-2">
            <Checkbox
              id="select-all"
              checked={allSelected}
              disabled={loading || allCount === 0}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              เลือกทั้งหมด
            </label>
          </div>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {loading && (
              <p className="text-sm text-muted-foreground px-1">กำลังโหลด...</p>
            )}
            {!loading && customers.length === 0 && (
              <p className="text-sm text-muted-foreground px-1">ไม่มีลูกค้า</p>
            )}
            {!loading &&
              customers.map((customer) => (
                <div key={customer.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`customer-${customer.id}`}
                    checked={selectedCustomerIds.includes(customer.id)}
                    disabled={loading}
                    onCheckedChange={() => handleToggle(customer.id)}
                  />
                  <label
                    htmlFor={`customer-${customer.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {customer.name}
                  </label>
                </div>
              ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
