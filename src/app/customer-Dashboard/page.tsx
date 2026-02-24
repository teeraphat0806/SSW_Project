"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import AddCustomerModal from "@/components/customer-Dashboard/AddCustomerModel";
import { useConfirm } from "@/components/providers/confirm-dialog-provider";
import { toast } from "react-toastify";
import CustomerViewEditModal from "@/components/customer-Dashboard/CustomerViewEditModal";
import SearchDebounce from "@/components/SearchDebounce";

type Customer = {
  id: number;
  name: string;
  tel: string | null;
  email: string | null;
  taxNumber: string;
  createdAt: string;
  updatedAt: string;
  billCount: number;
  orderCount: number;
  daysSinceLastBill: number | null;
};

type ApiResponse = {
  data: Customer[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    search?: string;
    sort?: string;
  };
};

const SORT_OPTIONS = [
  { label: "บิลมากที่สุด", value: "billCount-desc" },
  { label: "บิลน้อยที่สุด", value: "billCount-asc" },
  { label: "เพิ่มใหม่สุด", value: "createdAt-desc" },
  { label: "เพิ่มเก่าที่สุด", value: "createdAt-asc" },
  { label: "ชื่อ ก-ฮ", value: "name-asc" },
];

export default function CustomerDashboard() {
  const PAGE_SIZE = 10;

  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openCustomerModal, setOpenCustomerModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("billCount-desc");

  const [pagination, setPagination] = useState<ApiResponse["pagination"]>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const confirm = useConfirm();

  // ใช้ ref เก็บ controller เพื่อยกเลิก request เก่า
  const abortRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    params.set("sort", sort);

    const s = search.trim();
    if (s) params.set("search", s);

    return params.toString();
  }, [page, search, sort]);

  async function fetchCustomers(signal?: AbortSignal) {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?${queryString}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Fetch failed: ${res.status} ${text}`);
      }

      const json: ApiResponse = await res.json();

      setData(json.data ?? []);
      setPagination(
        json.pagination ?? {
          page,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err: any) {
      // ถ้ายกเลิก request ไม่ต้องโชว์ error
      //
      if (err?.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  // 1) เวลา search/sort เปลี่ยน -> reset page เป็น 1 แล้ว debounce ยิง
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      // cancel request เก่า
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // ยิงหน้า 1 (เพราะเรา reset แล้ว)
      fetchCustomers(controller.signal);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  // 2) เวลา page เปลี่ยน (จากกด next/prev) -> ยิงทันที ไม่ debounce
  useEffect(() => {
    // กันยิงซ้ำตอน page ถูก reset เป็น 1 จาก effect แรก
    // ถ้า search/sort เปลี่ยน effect แรกจะยิงเองอยู่แล้ว
    // แต่กรณีกด next/prev ให้ยิงทันที
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchCustomers(controller.signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const formatLastActive = (days: number | null) => {
    if (days === null)
      return <span className="text-zinc-400 dark:text-zinc-500">-</span>;
    if (days === 0)
      return (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          วันนี้
        </span>
      );
    return (
      <span className="text-zinc-600 dark:text-zinc-300">
        {days} วันที่แล้ว
      </span>
    );
  };

  const handleDelete = async ({ customerId }: { customerId: number }) => {
    const isConfirmed = await confirm({
      title: "ต้องการลบรายชื่อลูกค้านี้ออกจากระบบใช่หรือไม่?",
      description:
        "หากลบแล้วรายชื่อลูกค้าจะถูกลบออกจากระบบทันที (ลบไม่ได้ถ้ามีบิลหรือคำสั่งซื้อ)",
      variant: "destructive",
      confirmText: "ลบข้อมูล",
      cancelText: "ไม่ลบ",
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/customer/${customerId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(body?.error ?? `ลบไม่สำเร็จ (${res.status})`, {
          position: "bottom-right",
        });
        return;
      }

      toast.success("ลบลูกค้าสำเร็จ", { position: "bottom-right" });

      // รีเฟรชตาราง (ยกเลิก request เก่าก่อนกันทับกัน)
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetchCustomers(controller.signal);
    } catch {
      toast.error("การลบลูกค้าไม่สำเร็จ: กรุณาลองใหม่อีกครั้ง", {
        position: "bottom-right",
      });
    }
  };

  const totalCustomers = pagination.total;
  const totalPages = pagination.totalPages;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              รายชื่อลูกค้า
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              ดูรายการลูกค้า ค้นหา เรียงลำดับ และไปทำงานต่อได้ทันที
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-zinc-700 dark:text-zinc-300">
              <span className="text-sm">ลูกค้าทั้งหมด </span>
              <span className="font-semibold">{totalCustomers}</span>
              <span className="text-sm"> รายการ</span>
            </div>
            {/* flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 */}
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
              onClick={() => setOpenAdd(true)}
            >
              <Plus size={18} />
              <span>เพิ่มลูกค้า</span>
            </button>
          </div>
        </div>

        <AddCustomerModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onCreated={() => {
            fetchCustomers();
          }}
        />

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-950/50 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <SearchDebounce
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              onSearchChange={(value) => setSearch(value)}
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              เรียงตาม:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full md:w-56 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm transition-all"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm uppercase tracking-wider transition-colors">
                  <th className="p-4 font-medium text-center w-16">#</th>
                  <th className="p-4 font-medium">ลูกค้า</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">เบอร์โทร</th>
                  <th className="p-4 font-medium text-center">จำนวนบิล</th>
                  <th className="p-4 font-medium">สั่งล่าสุด</th>
                  <th className="p-4 font-medium text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span>กำลังโหลดข้อมูล...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-zinc-400 dark:text-zinc-500"
                    >
                      ไม่พบข้อมูลลูกค้า
                    </td>
                  </tr>
                ) : (
                  data.map((customer, index) => {
                    const canDelete =
                      customer.billCount === 0 && customer.orderCount === 0;

                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                      >
                        <td className="p-4 text-center text-zinc-400 dark:text-zinc-600">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {customer.name}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              id: {customer.id}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-zinc-700 dark:text-zinc-300">
                          {customer.email}
                        </td>

                        <td className="p-4 text-zinc-700 dark:text-zinc-300">
                          {customer.tel}
                        </td>

                        <td className="p-4 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                            <FileText size={14} />
                            {customer.billCount}
                          </div>
                        </td>

                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-zinc-400" />
                            {formatLastActive(customer.daysSinceLastBill)}
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100">
                            <button
                              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-all"
                              title="ดู/แก้ไข"
                              onClick={() => {
                                setSelectedCustomerId(customer.id);
                                setOpenCustomerModal(true);
                              }}
                            >
                              <Eye size={18} />
                            </button>
                            {canDelete ? (
                              <button
                                className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-all"
                                title="ลบลูกค้า"
                                onClick={() =>
                                  handleDelete({ customerId: customer.id })
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <div />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              หน้า {page} จาก {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 text-sm transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-50 text-sm transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <CustomerViewEditModal
            open={openCustomerModal}
            customerId={selectedCustomerId}
            onClose={() => {
              setOpenCustomerModal(false);
              setSelectedCustomerId(null);
            }}
            onUpdated={() => {
              // รีเฟรชตารางหลังแก้ไข
              fetchCustomers();
            }}
          />
        </div>
      </div>
    </div>
  );
}
