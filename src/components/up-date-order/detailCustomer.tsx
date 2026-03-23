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

// ── Types ────────────────────────────────────────────────────────
type CustomerApiItem = {
  id: string | number;
  name: string;
  taxNumber: string;
  tel?: string | null;
  email?: string | null;
  faxNumber?: string | null;
  address: string;
};

/** ข้อมูลลูกค้าที่ component จัดการเอง (fetch จาก API) */
type CustomerDetail = {
  id: string;
  name: string;
  taxNumber: string;
  phone: string | null;
  email: string | null;
  fax: string | null;
  address: string;
};

type DetailCustomerProps = {
  /** รับแค่ customerId จากภายนอก */
  customerId: string | number | null;
  /** callback เมื่อเลือกลูกค้าใหม่ — ส่ง id กลับไปให้ parent */
  onCustomerChange: (customerId: string) => void;
  className?: string;
};

// ── Helpers ──────────────────────────────────────────────────────
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function mapApiToDetail(c: CustomerApiItem): CustomerDetail {
  return {
    id: String(c.id),
    name: c.name ?? "",
    taxNumber: c.taxNumber ?? "",
    phone: c.tel ?? null,
    email: c.email ?? null,
    fax: c.faxNumber ?? null,
    address: c.address ?? "",
  };
}

// ── InfoItem (reusable) ─────────────────────────────────────────
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

// ── Main Component ──────────────────────────────────────────────
export default function DetailCustomer({
  customerId,
  onCustomerChange,
  className,
}: DetailCustomerProps) {
  // ── customer detail (fetched internally) ────────────────────
  const [detail, setDetail] = React.useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // ── popover / search state ──────────────────────────────────
  const [open, setOpen] = React.useState(false);
  const [searchCustomer, setSearchCustomer] = React.useState("");
  const [customers, setCustomers] = React.useState<CustomerApiItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Fetch customer detail by ID ─────────────────────────────
  React.useEffect(() => {
    if (!customerId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/customer/${customerId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed");
        const data: CustomerApiItem = await res.json();
        if (!cancelled) setDetail(mapApiToDetail(data));
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // ── Fetch customer list for search ──────────────────────────
  const fetchCustomers = React.useCallback(
    async (q: string, cancelledRef?: () => boolean) => {
      setLoading(true);
      setError(null);
      try {
        const param = new URLSearchParams();
        const keyword = q.trim();
        if (keyword) param.set("search", keyword);
        param.set("mode", "select");
        param.set("pageSize", "50");
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

  // ── Render ──────────────────────────────────────────────────
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      {/* Header Bar */}
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
                "bg-white hover:bg-zinc-50",
                "dark:bg-zinc-950 dark:hover:bg-zinc-900",
                "border border-zinc-300 dark:border-zinc-700",
                "shadow-sm",
                !detail?.name && "text-zinc-500",
              )}
            >
              <div className="flex items-center truncate">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">
                  {detail?.name || "ค้นหาลูกค้า..."}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[300px] p-0 shadow-xl"
            align="end"
          >
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
                    {customers.length === 0 ? (
                      <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                        ไม่พบข้อมูล
                      </CommandEmpty>
                    ) : (
                      <CommandGroup heading="รายชื่อ">
                        {customers.map((c) => {
                          const isSelected =
                            String(c.id) === String(customerId);
                          return (
                            <CommandItem
                              key={String(c.id)}
                              value={String(c.id)}
                              onSelect={() => {
                                onCustomerChange(String(c.id));
                                setOpen(false);
                              }}
                              className={cn(
                                "flex items-center justify-between text-xs cursor-pointer",
                                "aria-selected:bg-blue-50 aria-selected:text-blue-900 dark:aria-selected:bg-blue-900/20 dark:aria-selected:text-blue-100",
                              )}
                            >
                              <div className="flex flex-col truncate">
                                <span className="font-medium">{c.name}</span>
                                <span className="text-xs text-zinc-400">
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

      {/* Body: Customer detail */}
      <div className="p-4">
        {loadingDetail ? (
          <div className="flex items-center justify-center py-6 text-zinc-400">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-300 border-t-zinc-600" />
            <span className="ml-2 text-xs">กำลังโหลดข้อมูลลูกค้า...</span>
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            {/* Row 1: Primary Info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={Hash} label="รหัสลูกค้า" value={detail.id} />
              <InfoItem
                icon={FileBadge}
                label="เลขผู้เสียภาษี"
                value={detail.taxNumber}
              />
              <InfoItem
                icon={Phone}
                label="โทรศัพท์"
                value={detail.phone}
              />
              <InfoItem icon={Mail} label="อีเมล" value={detail.email} />
            </div>

            {/* Row 2: Fax / Address */}
            <div className="grid grid-cols-1 gap-4 border-t border-dashed border-zinc-200 pt-3 sm:grid-cols-12 dark:border-zinc-800">
              <div className="sm:col-span-3">
                <InfoItem
                  icon={Printer}
                  label="แทกซ์"
                  value={detail.taxNumber}
                />
              </div>

              <div className="sm:col-span-3">
                <InfoItem
                  icon={Printer}
                  label="แฟกซ์"
                  value={detail.fax}
                />
              </div>

              <div className="sm:col-span-6">
                <InfoItem
                  icon={MapPin}
                  label="ที่อยู่จัดส่ง"
                  value={detail.address}
                  className="items-start"
                />
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-400">
            <Building2 className="mb-2 h-8 w-8 opacity-20" />
            <p className="text-xs">กรุณาเลือกลูกค้าเพื่อแสดงรายละเอียด</p>
          </div>
        )}
      </div>
    </section>
  );
}
