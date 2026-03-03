"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, Printer } from "lucide-react";
import { User } from "lucide-react";
import { Loader2 } from "lucide-react";
interface Customer {
  id: number;
  name: string;
  code: string;
}

interface CustomerSale {
  id: number;
  date: string;
  dateISO: string;
  customer: {
    id: number;
    code: string;
    name: string;
  } | null;
  amount: number;
  subtotal: number;
  vat: number;
  quantity: number;
  billId: number | null;
  invoiceNo: string | null;
  formatted: {
    date: string;
    amount: string;
    subtotal: string;
    vat: string;
    quantity: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: CustomerSale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    year: number;
    month: number;
    monthName: string;
    totalAmount: number;
    totalQuantity: number;
    currency: string;
  };
}

interface CustomerSalesTableProps {
  year: string;
  month: string;
}

export function CustomerSalesTable({ year, month }: CustomerSalesTableProps) {
  const [data, setData] = useState<CustomerSale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch customers list
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(
          `/api/sale/customer/by-month?year=${year}&month=${month}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCustomers(result.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };

    fetchCustomers();
  }, [year, month]);

  // Fetch sales data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          year,
          month,
          page: page.toString(),
          limit: limit.toString(),
          sortBy,
          sortOrder,
        });

        if (selectedCustomerId && selectedCustomerId !== "all") {
          params.append("customerId", selectedCustomerId);
        }

        const response = await fetch(`/api/sale/customer-sales?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const result: ApiResponse = await response.json();

        if (result.success) {
          setData(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotal(result.pagination.total);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month, page, limit, selectedCustomerId, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

 
  // Helper for opening print tab(s)
  const handlePrint = async () => {
    window.open(`/saledashboard2/${year}/${month}/report/`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          ตารางรายได้ (ยอดขายตามลูกค้า)
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
        >
          <Printer className="h-4 w-4 mr-2" />
          พิมพ์รายงาน
        </Button>
      </div>

      

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">
              เลือกลูกค้า
            </label>
            <Select
              value={selectedCustomerId}
              onValueChange={(value) => {
                setSelectedCustomerId(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.code} - {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">เรียงตาม</label>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">วันที่</SelectItem>
                <SelectItem value="amount">ยอดขาย</SelectItem>
                <SelectItem value="quantity">จำนวนออเดอร์</SelectItem>
                <SelectItem value="customer">ชื่อลูกค้า</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="text-sm font-medium mb-2 block">ลำดับ</label>
            <Select
              value={sortOrder}
              onValueChange={(value: "asc" | "desc") => {
                setSortOrder(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">มากไปน้อย</SelectItem>
                <SelectItem value="asc">น้อยไปมาก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("customer")}
                >
                  <div className="flex items-center gap-2">
                    ลูกค้า
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("date")}
                >
                  <div className="flex items-center gap-2">
                    วันที่
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end gap-2">
                    ยอดสุทธิ
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  <div className="flex items-center justify-end gap-2">
                    ภาษี
                  </div>
                </th>
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("amount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    ยอดรวม
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("quantity")}
                >
                  <div className="flex items-center justify-end gap-2">
                    จำนวนบิล
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <Loader2 className="mr-2 h-12 w-12 animate-spin" />
                      <p className="text-lg mt-4 ">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <p className="text-sm">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((sale) => (
                  <tr
                    key={sale.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="flex  items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <User size={14} />
                        </div>

                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {sale.customer?.name || "ไม่ระบุ"}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {sale.customer?.code || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {sale.formatted.date}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {sale.formatted.subtotal}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-orange-600 dark:text-orange-400">
                        {sale.formatted.vat}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                        {sale.formatted.amount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {sale.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - inside table */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            หน้า {page} จาก {totalPages} ({total.toLocaleString()} รายการ)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
