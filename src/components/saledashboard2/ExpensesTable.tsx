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
import { Loader2 } from "lucide-react";
interface ExpenseCategory {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  date: string;
  dateISO: string;
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  description: string;
  amount: number;
  receiptUrl: string | null;
  staff: {
    id: number;
    name: string;
  } | null;
  formatted: {
    date: string;
    amount: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Expense[];
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
    categoryBreakdown: any[];
  };
}

interface ExpensesTableProps {
  year: string;
  month: string;
}

export function ExpensesTable({ year, month }: ExpensesTableProps) {
  const [data, setData] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch expense categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/sale/expenses/categories");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCategories(result.data.categories || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch expenses data
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

        if (selectedCategoryId && selectedCategoryId !== "all") {
          params.append("categoryId", selectedCategoryId);
        }

        const response = await fetch(`/api/sale/expenses?${params}`);

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
  }, [year, month, page, limit, selectedCategoryId, sortBy, sortOrder]);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          ตารางรายจ่าย (รายละเอียด)
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(
              `/saledashboard2/${year}/${month}/expense-report`,
              "_blank",
            )
          }
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
              ประเภทรายจ่าย
            </label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => {
                setSelectedCategoryId(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
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
                <SelectItem value="amount">ยอดเงิน</SelectItem>
                <SelectItem value="category">ประเภท</SelectItem>
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
                  onClick={() => handleSortChange("date")}
                >
                  <div className="flex items-center gap-2">
                    วันที่
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("category")}
                >
                  <div className="flex items-center gap-2">
                    ประเภท
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  รายละเอียด
                </th>
                <th
                  className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => handleSortChange("amount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    ยอดเงิน
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <Loader2 className="mr-2 h-12 w-12 animate-spin" />
                      <p className="text-lg mt-4 ">กำลังโหลดข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <p className="text-sm">ไม่พบข้อมูล</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((expense) => (
                  <tr
                    key={expense.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {expense.formatted.date}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {expense.category?.name || "ไม่ระบุ"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-md truncate text-sm text-zinc-700 dark:text-zinc-300">
                        {expense.description || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                        {expense.formatted.amount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - inside table */}
        {total > 0 && (
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
        )}
      </div>
    </div>
  );
}
