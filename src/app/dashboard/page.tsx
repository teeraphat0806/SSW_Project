"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  FileText,
  User,
  Edit,
  CheckCircle,
  Clock,
  Package,
  X,
  Loader2,
} from "lucide-react";
import { date } from "zod";
import { status } from "@/types";
import SearchDebounce from "@/components/SearchDebounce";

interface Order {
  id: number;
  poNumber: string;
  codetoinvoice: string;
  invoiceNo: string | null;
  status: status;
  customerName: string | null;
  grandTotal: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Summary {
  completedToday: number;
  notCompletedTotal: number;
  ordersThisMonth: number;
  todayBangkok?: string;
  monthBangkok?: string;
}

interface ApiResponse {
  summary: Summary;
  data: Order[];
  pagination: Pagination;
}

const toThaiStatus = (s: status): string => {
  switch (s) {
    case "pending":
      return "รอตัด";
    case "cutting":
      return "กำลังตัด";
    case "weighing":
      return "ชั่งน้ำหนัก";
    case "ready":
      return "พร้อมส่ง";
    case "shipped":
      return "กำลังส่ง";
    case "completed":
      return "เสร็จสิ้น";
    case "canceled":
      return "ยกเลิก";
    default:
      return "รอตัด";
  }
};

export default function Dashboard() {
  const didInitFilterEffect = useRef(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  const [summary, setSummary] = useState<Summary>({
    completedToday: 0,
    notCompletedTotal: 0,
    ordersThisMonth: 0,
  });
  const isJobStatus = (s: any): s is status =>
    [
      "pending",
      "cutting",
      "weighing",
      "ready",
      "shipped",
      "completed",
      "canceled",
    ].includes(s);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchOrders = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      const search = searchTerm.trim();
      if (search) params.set("search", search);

      if (statusFilter) params.set("status", statusFilter);
      if (invoiceFilter) params.set("invoice", invoiceFilter);

      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      params.set("page", String(pageOverride ?? pagination.page));
      params.set("pageSize", String(pagination.pageSize));

      const url = `/api/dashboard?${params.toString()}`;
      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      const json: ApiResponse = await res.json();

      const safeData: Order[] = (json.data ?? []).map((o: any) => ({
        ...o,
        status: isJobStatus(o.status) ? o.status : "pending",
      }));

      setOrders(safeData);
      setPagination(json.pagination);
      setSummary(json.summary);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setPagination((p) => ({ ...p, total: 0, totalPages: 0 }));
      setSummary({
        completedToday: 0,
        notCompletedTotal: 0,
        ordersThisMonth: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // เปลี่ยน filter → กลับไปหน้า 1 (แล้วค่อยให้ effect ของ page ยิง fetch)
  useEffect(() => {
    if (!didInitFilterEffect.current) {
      didInitFilterEffect.current = true;
      return;
    }

    setPagination((p) => {
      if (p.page !== 1) return { ...p, page: 1 };
      return p;
    });

    if (pagination.page === 1) {
      fetchOrders(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, invoiceFilter, dateFrom, dateTo]);

  // โหลดข้อมูลเมื่อ page เปลี่ยน (รวมถึงรอบแรก)
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatMonthYear = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "pending":
      case "cutting":
      case "weighing":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      case "completed":
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "canceled":
        return "bg-red-50 text-red-700 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";

      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            หน้าหลักออเดอร์
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            ภาพรวมคำสั่งซื้อและการจัดการสถานะ
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/statement" title="ดูเสร็จรับเงิน/ใบวางบิล">
            <button
              type="button"
              className="flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2.5 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
              aria-label="ดูเสร็จรับเงิน/ใบวางบิล"
            >
              <Printer size={18} />
            </button>
          </Link>

          <Link href="/createneworder">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
              <Plus size={20} />
              <span>สร้าง Order ใหม่</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Not completed total */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              กำลังดำเนินการ
            </p>
            <h3 className="text-3xl font-bold text-amber-500 mt-1">
              {summary.notCompletedTotal}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              ออเดอร์ที่ยังไม่เสร็จสิ้น
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock size={24} />
          </div>
        </div>

        {/* Completed today */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              เสร็จสิ้นวันนี้
            </p>
            <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {summary.completedToday}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              วันนี้ {formatDateOnly(summary.todayBangkok)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Orders this month */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              ออเดอร์เดือนนี้
            </p>
            <h3 className="text-3xl font-bold text-zinc-800 dark:text-white mt-1">
              {summary.ordersThisMonth}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              เดือน {formatMonthYear(summary.monthBangkok) ?? "นี้"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
        {/* เปลี่ยน items-end เป็น items-center หรือ items-end ตามความเหมาะสม แต่ Grid จัดการเรื่องความสูงไว้แล้ว */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search: หน้าจอ iPad (md) ให้กินพื้นที่ครึ่งจอ (6/12), จอใหญ่ (lg) ให้กิน 5/12 */}
          <div className="md:col-span-6 lg:col-span-4">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              ค้นหา
            </label>
            <div className="relative group">
              <SearchDebounce
                placeholder="ชื่อลูกค้า, เลข PO ,  รหัสออเดอร์"
                onSearchChange={(value) => setSearchTerm(value)}
                resetKey={searchResetKey}
              />
              {/* <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="ชื่อลูกค้า, เลข PO ,  รหัสออเดอร์"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}
            </div>
          </div>

          {/* Status: หน้าจอ iPad (md) ให้กินพื้นที่ครึ่งจอที่เหลือ (6/12), จอใหญ่ (lg) ให้กิน 2/12 */}
          <div className="md:col-span-3 lg:col-span-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              สถานะ
            </label>
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={16}
              />
              <select
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">รอตัด</option>
                <option value="cutting">กำลังตัด</option>
                <option value="weighing">ชั่งน้ำหนัก</option>
                <option value="ready">พร้อมส่ง</option>
                <option value="shipped">กำลังส่ง</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="canceled">ยกเลิก</option>
              </select>
            </div>
          </div>

          {/* Date Range + Refresh: หน้าจอ iPad (md) ให้ขึ้นบรรทัดใหม่เต็มจอ (12/12), จอใหญ่ (lg) กลับไปอยู่ท้ายแถว (5/12) */}
          <div className="md:col-span-3 lg:col-span-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              ใบแจ้งหนี้
            </label>
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={16}
              />
              <select
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all"
                value={invoiceFilter}
                onChange={(e) => setInvoiceFilter(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="pending">ยังไม่ออกใบแจ้งหนี้</option>
                <option value="invoiced">ออกใบแจ้งหนี้แล้ว</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                เริ่มต้น
              </label>
              <input
                /* เทคนิค: ถ้ามีค่าให้เป็น date, ถ้าไม่มีค่าให้เป็น text เพื่อโชว์ placeholder */
                type={dateFrom ? "date" : "text"}
                placeholder="วว/ดด/ปปปป"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
                max={new Date().toISOString().split("T")[0]}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                สิ้นสุด
              </label>
              <input
                type={dateTo ? "date" : "text"}
                placeholder="วว/ดด/ปปปป"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => {
                  if (!e.target.value) e.target.type = "text";
                }}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
                min={dateFrom}
                max={new Date().toISOString().split("T")[0]}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setSearchResetKey((k) => k + 1);
                setStatusFilter("");
                setInvoiceFilter("");
                setDateFrom("");
                setDateTo("");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="h-10 self-end px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/50 text-red-500 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap"
              title="ล้างตัวกรอง"
            >
              <X size={16} />
              <span>ล้าง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  รหัสออเดอร์
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  สถานะ
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  รวม
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  วันที่สร้าง
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  การดำเนินการ
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {String(order.codetoinvoice).padStart(6, "0")}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {order.poNumber && (
                            <span className="text-xs text-zinc-400">
                              PO: {order.poNumber}
                            </span>
                          )}
                          <span className="text-xs text-red-500">
                            HS:{" "}
                            {order.invoiceNo
                              ? String(order.invoiceNo).padStart(8, "0")
                              : "ยังไม่ได้ออกบิล"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {order.customerName ?? "-"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(
                          order.status,
                        )}`}
                      >
                        {toThaiStatus(order.status)}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <Link href={`/job-order-detail/${order.id}`}>
                        <button className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all">
                          <Edit size={18} /> แสดง
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <FileText size={48} className="mb-3 opacity-20" />
                      <p className="text-sm">ไม่พบข้อมูลที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            หน้า {pagination.page} จาก {pagination.totalPages || 1} (ทั้งหมด{" "}
            {pagination.total} รายการ)
          </span>

          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
