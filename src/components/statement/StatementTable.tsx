import React from "react";
import EditStatementDialog from "./EditStatementDialog";
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
  onEdit?: (statementId: number, invoiceIds: number[]) => void;
}

export default function StatementTable({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
  onEdit,
}: StatementTableProps) {
  return (
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    HS{item.statementNo.toString().padStart(6, "0")}
                  </TableCell>
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
                      selectedInvoices={item.invoices || []}
                      loading={false}
                      onUpdate={(invoiceIds) => {
                        if (onEdit) onEdit(item.id, invoiceIds);
                      }}
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
          หน้า {page} จาก {totalPages || 1}
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
  );
}
