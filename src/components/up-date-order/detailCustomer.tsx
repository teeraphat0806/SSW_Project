// components/up-date-order/detailCustomer.tsx
"use client";

import * as React from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Printer,
  ChevronsUpDown,
  Check,
  Hash,
  FileBadge,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge"; // ถ้ามี component นี้ (Optional)
import { Separator } from "@/components/ui/separator"; // ถ้ามี component นี้ (Optional)

type CustomerApiItem = {
  id: string | number;
  name: string;
  taxNumber: string;
  tel?: string | null;
  email?: string | null;
  faxNumber?: string | null;
  address: string;
};

type JobCustomerFields = {
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerFax: string | null;
  customerAddress: string;
};

type DetailCustomerProps<T extends JobCustomerFields> = {
  job: T | null;
  setJob: React.Dispatch<React.SetStateAction<T | null>>;
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function mapCustomerToJobFields(c: CustomerApiItem) {
  return {
    customerId: String(c.id),
    customerName: c.name ?? "",
    customerTaxId: c.taxNumber ?? "",
    customerPhone: c.tel ?? null,
    customerEmail: c.email ?? null,
    customerFax: c.faxNumber ?? null,
    customerAddress: c.address ?? "",
  };
}

// Helper component สำหรับแสดงข้อมูลแต่ละ field แบบประหยัดพื้นที่
const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value?: string | null;
  className?: string;
}) => {
  const hasValue =
    value != null && (typeof value !== "string" || value.trim() !== "");
  const displayValue = hasValue ? value : "ไม่พบข้อมูล";
  return (
    <div className={cn("flex items-start gap-2 text-sm", className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <span
          className={cn(
            "break-words font-medium",
            hasValue
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-400 dark:text-zinc-500 font-normal",
          )}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
};

export default function DetailCustomer<T extends JobCustomerFields>({
  job,
  setJob,
  className,
}: DetailCustomerProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchCustomer, setSearchCustomer] = React.useState("");
  const [customers, setCustomers] = React.useState<CustomerApiItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCustomers = React.useCallback(
    async (q: string, cancelledRef?: () => boolean) => {
      setLoading(true);
      setError(null);
      try {
        const param = new URLSearchParams();
        const keyword = q.trim();
        if (keyword) param.set("search", keyword);
        param.set("mode", "select"); // โหมดเลือกลูกค้า
        param.set("pageSize", "50"); // ดึงข้อมูลเยอะขึ้นสำหรับการค้นหา
        const url = `/api/customer?${param.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || `Error: ${res.status}`);
        if (cancelledRef?.()) return;

        const list: CustomerApiItem[] = Array.isArray(data)
          ? data
          : (data?.data ?? []);
        setCustomers(list);
      } catch (e) {
        if (!cancelledRef?.())
          setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!cancelledRef?.()) setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      () => fetchCustomers(searchCustomer, () => cancelled),
      300,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchCustomer, fetchCustomers]);

  React.useEffect(() => {
    if (!open || customers.length > 0) return;
    let cancelled = false;
    fetchCustomers("", () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [open]); // eslint-disable-line

  if (!job) return null; // หรือ Loading state เล็กๆ

  const selectedLabel = job.customerName || "ค้นหาและเลือกลูกค้า...";

  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {/* Header Bar: เน้นที่การเลือกเป็นหลัก */}
      <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            ข้อมูลลูกค้า
          </span>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between sm:w-[280px]",
                // ✅ 1. ลงสีพื้นหลังเป็นสีขาวทึบ (ไม่เอาสีเทาจางๆ แล้ว)
                "bg-white hover:bg-zinc-50",
                "dark:bg-zinc-950 dark:hover:bg-zinc-900",
                // ✅ 2. เพิ่มเส้นขอบให้ชัด
                "border border-zinc-300 dark:border-zinc-700",
                // ✅ 3. ใส่เงาเพื่อให้ปุ่มดูลอยออกมาจากพื้นหลัง
                "shadow-sm",
                !job.customerName && "text-zinc-500",
              )}
            >
              <div className="flex items-center truncate">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">
                  {job.customerName || "ค้นหาลูกค้า..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[300px] p-0 shadow-xl" // ✅ เพิ่มเงาใหญ่ (shadow-xl) ให้ Dropdown ลอยเด่น
            align="end"
          >
            {/* ✅ 4. บังคับสีพื้นหลังของ Dropdown ให้ทึบแน่นอน */}
            <Command
              shouldFilter={false}
              className="max-h-[300px] bg-white dark:bg-zinc-950"
            >
              <CommandInput
                placeholder="พิมพ์ชื่อลูกค้า..."
                value={searchCustomer}
                onValueChange={setSearchCustomer}
                className="text-xs"
              />
              <CommandList>
                {loading && (
                  <div className="p-4 text-xs text-center text-zinc-500 bg-white dark:bg-zinc-950">
                    Loading...
                  </div>
                )}
                {!loading && error && (
                  <div className="p-4 text-xs text-red-500 bg-white dark:bg-zinc-950">
                    {error}
                  </div>
                )}
                {!loading && !error && (
                  <div className="bg-white dark:bg-zinc-950">
                    {/* ✅ ครอบด้วย div ที่มี bg สีทึบอีกชั้นเพื่อความชัวร์ */}
                    {customers.length === 0 ? (
                      <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                        ไม่พบข้อมูล
                      </CommandEmpty>
                    ) : (
                      <CommandGroup heading="รายชื่อ">
                        {customers.map((c) => {
                          const isSelected =
                            String(c.id) === String(job.customerId);
                          return (
                            <CommandItem
                              key={String(c.id)}
                              value={String(c.id)}
                              onSelect={() => {
                                setJob((prev) =>
                                  prev
                                    ? { ...prev, ...mapCustomerToJobFields(c) }
                                    : prev,
                                );
                                setOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between text-xs cursor-pointer",
                                // ✅ เพิ่มสีเวลาเอาเมาส์ชี้ (Hover) ให้ชัดเจน
                                "aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100",
                              )}
                            >
                              <div className="flex flex-col truncate">
                                <span className="font-medium">{c.name}</span>
                                <span className="textxs text-zinc-400">
                                  id: {c.id}
                                </span>
                              </div>
                              {isSelected && (
                                <Check className="ml-2 h-3 w-3 text-blue-600" />
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Body: แสดงข้อมูลแบบ Compact */}
      <div className="p-4">
        {job.customerName ? (
          <div className="flex flex-col gap-4">
            {/* Row 1: Primary Info (Code & Tax) */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={Hash} label="รหัสลูกค้า" value={job.customerId} />
              <InfoItem
                icon={FileBadge}
                label="เลขผู้เสียภาษี"
                value={job.customerTaxId}
              />
              <InfoItem
                icon={Phone}
                label="โทรศัพท์"
                value={job.customerPhone}
              />
              <InfoItem icon={Mail} label="อีเมล" value={job.customerEmail} />
            </div>

            {/* Fax / ที่อยู่: ถ้าไม่มีข้อมูลให้แสดงเป็น "-" */}
            <div className="grid grid-cols-1 gap-4 border-t border-dashed border-zinc-200 pt-3 sm:grid-cols-12 dark:border-zinc-800">
              <div className="sm:col-span-3">
                <InfoItem
                  icon={Printer}
                  label="แทกซ์"
                  value={job.customerTaxId}
                />
              </div>

              <div className="sm:col-span-3">
                <InfoItem
                  icon={Printer}
                  label="แฟกซ์"
                  value={job.customerFax}
                />
              </div>

              <div className="sm:col-span-6">
                <InfoItem
                  icon={MapPin}
                  label="ที่อยู่จัดส่ง"
                  value={job.customerAddress}
                  className="items-start"
                />
              </div>
            </div>
          </div>
        ) : (
          // Empty State แบบสวยๆ
          <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">
            <Building2 className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">กรุณาเลือกลูกค้าเพื่อแสดงรายละเอียด</p>
          </div>
        )}
      </div>
    </section>
  );
}
