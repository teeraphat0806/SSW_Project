import React, { useState } from "react";
import {
  Trash2,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import SelectCustomer from "../SelectCustomer";
import { Input } from "../ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";

interface CustomerOption {
  id: number;
  name: string;
}
interface InvoiceItem {
  id: number;
  invoiceNo: number;
  total: number;
  createdAt: string;
}

interface CreateStatementDialogProps {
  customers: CustomerOption[];
  onCreate: (data: {
    customerId: number;
    date: string;
    invoiceIds: number[];
  }) => void;
  loading: boolean;
}

export default function CreateStatementDialog({
  customers,
  onCreate,
  loading,
}: CreateStatementDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<
    string | number | null
  >(null);
  const [date, setDate] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([
    // mock data
    {
      id: 1,
      invoiceNo: 1201,
      total: 10000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      invoiceNo: 1202,
      total: 20000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      invoiceNo: 1203,
      total: 30000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      invoiceNo: 1204,
      total: 40000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 5,
      invoiceNo: 1205,
      total: 50000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 6,
      invoiceNo: 1206,
      total: 60000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 7,
      invoiceNo: 1207,
      total: 70000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 8,
      invoiceNo: 1208,
      total: 80000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 9,
      invoiceNo: 1209,
      total: 90000,
      createdAt: new Date().toISOString(),
    },
    {
      id: 10,
      invoiceNo: 1210,
      total: 100000,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showSelectedTable, setShowSelectedTable] = useState(true);
  const [showSelectedTable2, setShowSelectedTable2] = useState(true);
  const [selectedPage, setSelectedPage] = useState(1);

  // TODO: fetch invoiceList by customer and search

  const totalIncome = selectedInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoiceList: remove those already selected
  const filteredInvoiceList = invoiceList.filter(
    (inv) => !selectedInvoices.some((sel) => sel.id === inv.id),
  );
  const pagedInvoiceList = filteredInvoiceList.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const invoiceTotalPages =
    Math.ceil(filteredInvoiceList.length / pageSize) || 1;

  // Selected invoices pagination
  const pagedSelectedInvoices = selectedInvoices.slice(
    (selectedPage - 1) * pageSize,
    selectedPage * pageSize,
  );
  const selectedTotalPages = Math.ceil(selectedInvoices.length / pageSize) || 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
          สร้างใบวางบิล
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 text-white rounded-2xl p-6 shadow-xl border border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2">
            สร้างใบวางบิล (Statement) ใหม่
          </DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-4"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {/* Row: ลูกค้า, วันที่, ยอดรวม, หมายเหตุ */}
          <div className="flex flex-wrap gap-3 items-center rounded-2xl bg-zinc-800 p-4">
            <div className="flex flex-col">
              <span className="text-xs mb-1">ลูกค้า</span>
              <SelectCustomer
                open={customerOpen}
                setOpen={setCustomerOpen}
                selectedCustomerId={selectedCustomer}
                setSelectedCustomer={setSelectedCustomer}
                customers={customers}
                search={customerSearch}
                setSearch={setCustomerSearch}
                loading={loading}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs mb-1">วันที่ออก</span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-36 bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs mb-1">เลือกแล้ว</span>
              <div className="bg-zinc-800 rounded px-3 py-1 min-w-15 text-center">
                {selectedInvoices.length} ใบ
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs mb-1">ยอดรวม (ประมาณ)</span>
              <div className="bg-zinc-800 rounded px-3 py-1 min-w-25 text-center">
                {totalIncome.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                })}
              </div>
            </div>
          </div>
          {/* Row: ค้นหา invoice, pagination */}

          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Invoice ที่เลือกแล้ว</span>
            <div className="ml-auto relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="ค้นหา InvoiceNo เช่น 1201"
                className="h-9 w-full rounded-lg border-zinc-600 bg-zinc-900/70 pl-9 text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <Button
                size="icon"
                variant="ghost"
                className="group h-8 w-8 rounded-full border border-zinc-600/80 bg-zinc-700/60 text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-zinc-400 hover:bg-zinc-600 hover:shadow-md active:scale-95"
                onClick={() => setShowSelectedTable((v) => !v)}
                aria-label={
                  showSelectedTable
                    ? "Hide selected invoices"
                    : "Show selected invoices"
                }
              >
                {showSelectedTable ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                )}
              </Button>
            </div>
          </div>

          <div
            className="bg-zinc-800 rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showSelectedTable && (
              <>
                <Table className="border border-zinc-600/90">
                  <TableHeader className="bg-zinc-700/40">
                    <TableRow className="border-b border-zinc-600/90">
                      <TableHead className="border-r border-zinc-600/90">
                        InvoiceNo
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        วันที่ Invoice
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        BillId
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        GrandTotal
                      </TableHead>
                      <TableHead>ลบ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedSelectedInvoices.length === 0 ? (
                      <TableRow className="border-b border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-zinc-700/80 text-center text-zinc-400"
                        >
                          ยังไม่มีการเลือก
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedSelectedInvoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="border-b border-zinc-700/80 last:border-b-0"
                        >
                          <TableCell className="border-r border-zinc-700/80">
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {new Date(inv.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            -
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {inv.total.toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                setSelectedInvoices(
                                  selectedInvoices.filter(
                                    (i) => i.id !== inv.id,
                                  ),
                                );
                              }}
                              className="hover:text-red-600 hover:cursor-pointer"
                            >
                              <Trash2 className="w-10 h-10" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {/* Pagination for selected invoices */}
                <div className="py-4 px-6 border-t border-zinc-700 flex items-center justify-between bg-zinc-900/50 mt-2 rounded-b-xl">
                  <span className="text-sm text-zinc-400">
                    หน้า {selectedPage} จาก {selectedTotalPages} (ทั้งหมด{" "}
                    {selectedInvoices.length} รายการ)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => setSelectedPage(selectedPage - 1)}
                      disabled={selectedPage <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => setSelectedPage(selectedPage + 1)}
                      disabled={selectedPage >= selectedTotalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Invoice ที่เลือกได้</span>
            <div className="ml-auto relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="ค้นหา InvoiceNo เช่น 1201"
                className="h-9 w-full rounded-lg border-zinc-600 bg-zinc-900/70 pl-9 text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between mb-2">
              <Button
                size="icon"
                variant="ghost"
                className="group h-8 w-8 rounded-full border border-zinc-600/80 bg-zinc-700/60 text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-zinc-400 hover:bg-zinc-600 hover:shadow-md active:scale-95"
                onClick={() => setShowSelectedTable2((v) => !v)}
                aria-label={
                  showSelectedTable2
                    ? "Hide selected invoices"
                    : "Show selected invoices"
                }
              >
                {showSelectedTable2 ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                )}
              </Button>
            </div>
          </div>
          <div
            className="bg-zinc-800 rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showSelectedTable2 && (
              <>
                <Table className="border border-zinc-600/90">
                  <TableHeader className="bg-zinc-700/40">
                    <TableRow className="border-b border-zinc-600/90">
                      <TableHead className="border-r border-zinc-600/90">
                        InvoiceNo
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        วันที่ Invoice
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        BillId
                      </TableHead>
                      <TableHead className="border-r border-zinc-600/90">
                        GrandTotal
                      </TableHead>
                      <TableHead>เลือก</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedInvoiceList.length === 0 ? (
                      <TableRow className="border-b border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-zinc-700/80 text-center text-zinc-400"
                        >
                          ไม่พบข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedInvoiceList.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="border-b border-zinc-700/80 last:border-b-0"
                        >
                          <TableCell className="border-r border-zinc-700/80">
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {new Date(inv.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            -
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {inv.total.toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            <Button
                              size="icon"
                              onClick={() => {
                                setSelectedInvoices([...selectedInvoices, inv]);
                              }}
                              aria-label="Select invoice"
                              className="group rounded-full cursor-pointer"
                            >
                              <Check className="h-4 w-4 transition-all duration-150 group-hover:scale-110 group-hover:stroke-[2.6]" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="py-4 px-6 border-t border-zinc-700 flex items-center justify-between bg-zinc-900/50 mt-2 rounded-b-xl">
                  <span className="text-sm text-zinc-400">
                    หน้า {page} จาก {invoiceTotalPages} (ทั้งหมด{" "}
                    {filteredInvoiceList.length} รายการ)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= invoiceTotalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* ข้อความแนะนำ */}
          <div className="text-xs text-zinc-400 mt-2">
            เลือก ลูกค้า → เลือก invoice → กด "สร้างใบวางบิล" – (Fake)
            จะสร้างเลข statementNo ให้เอง
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white"
          >
            พิมพ์
          </Button>
          <Button
            onClick={() => {
              if (selectedCustomer && date && selectedInvoices.length > 0) {
                onCreate({
                  customerId: Number(selectedCustomer),
                  date,
                  invoiceIds: selectedInvoices.map((i) => i.id),
                });
                setOpen(false);
              }
            }}
            disabled={
              loading ||
              !selectedCustomer ||
              !date ||
              selectedInvoices.length === 0
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            สร้างใบวางบิล
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
