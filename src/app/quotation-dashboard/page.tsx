"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  User,
  Edit,
  X,
  Loader2,
} from "lucide-react";
import SearchDebounce from "@/components/SearchDebounce";

interface QuotationRow {
  id: number;
  codetoinvoice: number;
  quotationNo: number | null;
  invoiceNo: number | null;
  customerName: string | null;
  companyName: string | null;
  billStatus: "billed" | "unbilled";
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  data: QuotationRow[];
  pagination: Pagination;
}

export default function QuotationDashboardPage() {
  const didInitFilterEffect = useRef(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<QuotationRow[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [billFilter, setBillFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchQuotationRows = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const search = searchTerm.trim();

      if (search) params.set("search", search);
      if (billFilter) params.set("bill", billFilter);
      if (invoiceFilter) params.set("invoice", invoiceFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      params.set("page", String(pageOverride ?? pagination.page));
      params.set("pageSize", String(pagination.pageSize));

      const res = await fetch(`/api/quotation-dashboard?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }

      const json: ApiResponse = await res.json();
      setRows(json.data ?? []);
      setPagination(json.pagination);
    } catch (error) {
      console.error(error);
      setRows([]);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!didInitFilterEffect.current) {
      didInitFilterEffect.current = true;
      return;
    }

    setPagination((prev) => {
      if (prev.page !== 1) return { ...prev, page: 1 };
      return prev;
    });

    if (pagination.page === 1) {
      fetchQuotationRows(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, billFilter, invoiceFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchQuotationRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            หน้าหลักใบเสนอราคา
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            ภาพรวมรายการใบเสนอราคาและสถานะเอกสาร
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-sm">
            <Link href="/dashboard">
              <button className="px-3 py-1.5 text-sm rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                หน้าหลักออเดอร์
              </button>
            </Link>
            <Link href="/quotation-dashboard">
              <button className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white shadow-sm transition-all duration-300">
                หน้าหลักใบเสนอราคา
              </button>
            </Link>
          </div>

          <Link href="/create-new-quotation">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
              <Plus size={20} />
              <span>สร้างใบเสนอราคาใหม่</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6 lg:col-span-4">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              ค้นหา
            </label>
            <div className="relative group">
              <SearchDebounce
                placeholder="ชื่อลูกค้า, เลข Quotation, รหัสออเดอร์"
                onSearchChange={(value) => setSearchTerm(value)}
                resetKey={searchResetKey}
              />
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              สถานะบิล
            </label>
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                size={16}
              />
              <select
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all"
                value={billFilter}
                onChange={(e) => setBillFilter(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="unbilled">ยังไม่ออกออเดอร์</option>
                <option value="billed">ออกออเดอร์แล้ว</option>
              </select>
            </div>
          </div>

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
                setBillFilter("");
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

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  รหัสออเดอร์
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  ชื่อลูกค้า
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ">
                  ชื่อบริษัท
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  เลขใบแจ้งหนี้
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  สถานะบิล
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
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150"
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {String(row.codetoinvoice).padStart(6, "0")}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {row.quotationNo && (
                          <span className="text-xs text-zinc-400">
                            {row.quotationNo}
                          </span>
                        )}
                        <span className="text-xs text-red-500">
                          HS:{" "}
                          {row.invoiceNo
                            ? String(row.invoiceNo).padStart(8, "0")
                            : "ยังไม่ได้ออกบิล"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {row.customerName ?? "-"}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-left">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {row.companyName ?? "-"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm text-zinc-700 dark:text-zinc-200">
                        {row.invoiceNo
                          ? String(row.invoiceNo).padStart(8, "0")
                          : "-"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                          row.billStatus === "billed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        }`}
                      >
                        {row.billStatus === "billed"
                          ? "ออกออเดอร์แล้ว"
                          : "ยังไม่ออกออเดอร์"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(row.createdAt)}
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <Link href={`/quotation-detail/${row.id}`}>
                        <button className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all">
                          <Edit size={18} /> แสดง
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      <span>กำลังโหลดข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
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
