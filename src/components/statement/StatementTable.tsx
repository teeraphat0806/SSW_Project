import React from "react";
import EditStatementDialog from "./EditStatementDialog";
import StatementReceiptDialog from "./StatementReceiptDialog";
import SearchDebounce from "@/components/SearchDebounce";
import { X } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";

export interface Statement {
  id: number;
  statementNo: number;
  customerId: number;
  customerName: string;
  createdAt: string;
  totalIncome: number;
  invoiceCount: number;
  invoices?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoiceNo: number;
  total: number;
  createdAt: string;
}

export interface StatementTableProps {
  data: Statement[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit?: (
    statementId: number,
    payload: { invoiceIds: number[]; statementDate?: string },
  ) => Promise<void> | void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  onClearFilters?: () => void;
}

export default function StatementTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  onEdit,
  searchTerm = "",
  onSearchChange,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: StatementTableProps) {
  return (
    <>
      {/* Filter Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-6 lg:col-span-4">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
              ค้นหา
            </label>
            <div className="relative group">
              <SearchDebounce
                placeholder="ชื่อลูกค้า, เลขที่ Statement"
                onSearchChange={onSearchChange}
              />
            </div>
          </div>

          {/* Date Range */}
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
                onChange={(e) => onDateFromChange?.(e.target.value)}
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
                onChange={(e) => onDateToChange?.(e.target.value)}
              />
            </div>

            <button
              onClick={onClearFilters}
              className="h-10 self-end px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/50 text-red-500 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 inline-flex shrink-0 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap"
              title="ล้างตัวกรอง"
            >
              <X size={16} />
              <span>ล้าง</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขใบวางบิล</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>จำนวน Invoice</TableHead>
                <TableHead>ยอดรวมรายได้</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>แก้ไข</TableHead>
                <TableHead>พิมพ์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>HS{item.statementNo.toString()}</TableCell>
                    <TableCell>{item.customerName}</TableCell>
                    <TableCell>{item.invoiceCount}</TableCell>
                    <TableCell>
                      {item.totalIncome.toLocaleString("th-TH", {
                        style: "currency",
                        currency: "THB",
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString("th-TH")}
                    </TableCell>
                    <TableCell>
                      <EditStatementDialog
                        statementId={item.id}
                        customerId={item.customerId}
                        statementCreatedAt={item.createdAt}
                        selectedInvoices={item.invoices || []}
                        loading={false}
                        onUpdate={(payload) => {
                          if (onEdit) onEdit(item.id, payload);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <StatementReceiptDialog
                        customerId={item.customerId}
                        statementNo={item.statementNo}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            หน้า {page} จาก {totalPages || 1} (ทั้งหมด {data.length || 1}{" "}
            รายการ)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              &lt;
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
