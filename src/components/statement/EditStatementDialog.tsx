import React, { useEffect, useState } from "react";
import {
  Trash2,
  Check,
  Edit,
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
import { Input } from "../ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";

interface InvoiceItem {
  id: number;
  invoiceNo: number;
  total: number;
  createdAt: string;
  billId?: number | null;
}

interface CustomerInvoiceApiItem {
  id: number;
  invoiceNo: number;
  createdAt: string;
  grandTotal: number;
  billId?: number | null;
}

interface EditStatementDialogProps {
  statementId: number;
  customerId: number;
  selectedInvoices: InvoiceItem[];
  onUpdate: (invoiceIds: number[]) => void;
  loading: boolean;
}

export default function EditStatementDialog({
  statementId,
  customerId,
  selectedInvoices,
  onUpdate,
  loading,
}: EditStatementDialogProps) {
  const [open, setOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceSearch2, setInvoiceSearch2] = useState("");
  const [currentInvoices, setCurrentInvoices] =
    useState<InvoiceItem[]>(selectedInvoices);
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceItem[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [showSelectedTable, setShowSelectedTable] = useState(true);
  const [showAvailableTable, setShowAvailableTable] = useState(true);
  const [selectedPage, setSelectedPage] = useState(1);

  const fetchAvailableInvoices = async () => {
    setAvailableLoading(true);
    try {
      const res = await fetch(`/api/invoice/customer/${customerId}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch customer invoices");

      const data = await res.json();
      const apiItems: CustomerInvoiceApiItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setAvailableInvoices(
        apiItems.map((inv) => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          total: Number(inv.grandTotal ?? 0),
          createdAt: inv.createdAt,
          billId: inv.billId ?? null,
        })),
      );
    } catch (error) {
      console.error("Failed to fetch available invoices", error);
      setAvailableInvoices([]);
    } finally {
      setAvailableLoading(false);
    }
  };

  const handleAddInvoice = async (invoice: InvoiceItem) => {
    try {
      const res = await fetch("/api/statement/add-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementId,
          invoiceId: invoice.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to add invoice:", error);
        alert(error.error || "Failed to add invoice");
        return;
      }

      setCurrentInvoices((prev) => [...prev, invoice]);
      await fetchAvailableInvoices();
    } catch (error) {
      console.error("Failed to add invoice", error);
      alert("Failed to add invoice");
    }
  };

  const handleRemoveInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch("/api/statement/remove-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementId,
          invoiceId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Failed to remove invoice:", error);
        alert(error.error || "Failed to remove invoice");
        return;
      }

      setCurrentInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      await fetchAvailableInvoices();
    } catch (error) {
      console.error("Failed to remove invoice", error);
      alert("Failed to remove invoice");
    }
  };

  useEffect(() => {
    if (!open) return;

    setCurrentInvoices(selectedInvoices);
    setSelectedPage(1);
    setPage(1);

    void fetchAvailableInvoices();
  }, [open, customerId, selectedInvoices]);

  const filteredInvoiceList = availableInvoices.filter(
    (inv) =>
      !currentInvoices.some((sel) => sel.id === inv.id) &&
      (invoiceSearch2 === "" ||
        inv.invoiceNo.toString().includes(invoiceSearch2)),
  );
  const pagedInvoiceList = filteredInvoiceList.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const invoiceTotalPages =
    Math.ceil(filteredInvoiceList.length / pageSize) || 1;

  // Selected invoices pagination
  const pagedSelectedInvoices = currentInvoices.slice(
    (selectedPage - 1) * pageSize,
    selectedPage * pageSize,
  );
  const selectedTotalPages = Math.ceil(currentInvoices.length / pageSize) || 1;

  // รวมยอด invoice ที่เลือกแล้ว
  const selectedTotalAmount = currentInvoices.reduce(
    (sum, inv) => sum + inv.total,
    0,
  );

  // ฟังก์ชันแก้ไขวันที่ออก invoice
  const handleDateChange = (id: number, newDate: string) => {
    setCurrentInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, createdAt: newDate } : inv)),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Edit statement"
          className="cursor-pointer border-zinc-600 text-zinc-100 hover:border-blue-500 hover:bg-blue-500/15 hover:text-blue-400"
        >
          <button className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all">
            <Edit size={18} />
          </button>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 text-white rounded-2xl p-6 shadow-xl border border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2">
            แก้ไข Invoice ใน Statement #{statementId}
          </DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-4"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {/* Row: ค้นหา invoice */}
          <div className="flex flex-wrap gap-3 items-center bg-zinc-800 rounded-xl px-4 py-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">เลือกแล้ว</span>
              <span className="inline-block bg-blue-600/90 text-white text-base font-bold rounded-lg px-3 py-1 shadow-sm">
                {currentInvoices.length} ใบ
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">ยอดรวม</span>
              <span className="inline-block bg-green-600/90 text-white text-base font-bold rounded-lg px-3 py-1 shadow-sm">
                {selectedTotalAmount.toLocaleString("th-TH", {
                  style: "currency",
                  currency: "THB",
                })}
              </span>
            </div>
          </div>
          {/* Section: Invoice ที่เลือกแล้ว (ซ่อน/แสดงได้) */}
          <div className="flex items-center justify-between gap-4">
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
                        วันที่ออก
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
                            HS{inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            <Input
                              type="date"
                              className="bg-zinc-800 border-zinc-700 text-white w-36"
                              value={(() => {
                                // แปลงวันที่เป็น yyyy-MM-dd
                                const d = new Date(inv.createdAt);
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(
                                  2,
                                  "0",
                                );
                                const dd = String(d.getDate()).padStart(2, "0");
                                return `${yyyy}-${mm}-${dd}`;
                              })()}
                              onChange={(e) =>
                                handleDateChange(inv.id, e.target.value)
                              }
                            />
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
                              onClick={() => handleRemoveInvoice(inv.id)}
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
                <div className="py-4 px-6 border-t border-zinc-700 flex items-center justify-between bg-zinc-900/50 mt-2 rounded-b-xl">
                  <span className="text-sm text-zinc-400">
                    หน้า {selectedPage} จาก {selectedTotalPages} (ทั้งหมด{" "}
                    {currentInvoices.length} รายการ)
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
          {/* Section: Invoice ที่เลือกได้ (ยังไม่ถูกเลือก) */}
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Invoice ที่เลือกได้</span>
            <div className="ml-auto relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                value={invoiceSearch2}
                onChange={(e) => {
                  setInvoiceSearch2(e.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหา InvoiceNo เช่น 1201"
                className="h-9 w-full rounded-lg border-zinc-600 bg-zinc-900/70 pl-9 text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-zinc-600/80 bg-zinc-700/60 text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-zinc-400 hover:bg-zinc-600 hover:shadow-md active:scale-95"
              onClick={() => setShowAvailableTable((v) => !v)}
              aria-label={
                showAvailableTable
                  ? "Hide available invoices"
                  : "Show available invoices"
              }
            >
              {showAvailableTable ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
              )}
            </Button>
          </div>
          <div
            className="bg-zinc-800 rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showAvailableTable && (
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
                    {availableLoading ? (
                      <TableRow className="border-b border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-zinc-700/80 text-center text-zinc-400"
                        >
                          กำลังโหลด...
                        </TableCell>
                      </TableRow>
                    ) : pagedInvoiceList.length === 0 ? (
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
                            HS{inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {new Date(inv.createdAt).toLocaleDateString(
                              "th-TH",
                            )}
                          </TableCell>
                          <TableCell className="border-r border-zinc-700/80">
                            {inv.billId ?? "-"}
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
                              onClick={() => handleAddInvoice(inv)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
