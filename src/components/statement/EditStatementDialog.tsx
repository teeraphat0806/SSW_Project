import React, { useEffect, useState } from "react";
import {
  Trash2,
  Check,
  Edit,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  X,
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
import SearchDebounce from "@/components/SearchDebounce";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../ui/table";
import { formatThaiDateLong } from "@/lib/dateformat";
import MonthSelectionModal from "./MonthSelectionModal";
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
  statementNo: number | null;
  customerId: number;
  statementCreatedAt: string;
  selectedInvoices: InvoiceItem[];
  onUpdate: (payload: {
    invoiceIds: number[];
    statementDate?: string;
  }) => Promise<void> | void;
  loading: boolean;
}

export default function EditStatementDialog({
  statementId,
  statementNo,
  customerId,
  statementCreatedAt,
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
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [monthSelectionOpen, setMonthSelectionOpen] = useState(false);
  const [statementDate, setStatementDate] = useState(
    new Date(statementCreatedAt).toISOString().split("T")[0],
  );

  const fetchCustomerName = async () => {
    try {
      const res = await fetch(`/api/customer/${customerId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch customer");
      const data = await res.json();
      setCustomerName(data.name || "");
    } catch (error) {
      console.error("Failed to fetch customer name", error);
      setCustomerName("");
    }
  };

  const fetchAvailableInvoices = async () => {
    setAvailableLoading(true);
    try {
      const res = await fetch(
        `/api/invoice/customer/${customerId}?excludeStatementUsed=true`,
        {
          cache: "no-store",
        },
      );

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

  const handleAddInvoice = (invoice: InvoiceItem) => {
    if (currentInvoices.some((item) => item.id === invoice.id)) return;
    setCurrentInvoices([...currentInvoices, invoice]);
  };

  const handleRemoveInvoice = (invoiceId: number) => {
    setCurrentInvoices(currentInvoices.filter((i) => i.id !== invoiceId));
  };

  const handleRemoveAll = () => {
    setCurrentInvoices([]);
  };

  const handleConfirmMonthSelection = (invoices: InvoiceItem[]) => {
    setCurrentInvoices((current) => {
      const newInvoices = invoices.filter(
        (invoice) => !current.some((selected) => selected.id === invoice.id),
      );
      return [...current, ...newInvoices];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        invoiceIds: currentInvoices.map((inv) => inv.id),
        statementDate,
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save statement", error);
      alert("Failed to save statement");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const initialStatementDate = new Date(statementCreatedAt)
      .toISOString()
      .split("T")[0];

    if (statementDate !== initialStatementDate) return true;

    if (currentInvoices.length !== selectedInvoices.length) return true;
    const selectedIds = new Set(selectedInvoices.map((inv) => inv.id));
    return currentInvoices.some((inv) => !selectedIds.has(inv.id));
  };

  useEffect(() => {
    if (!open) return;

    setCurrentInvoices(selectedInvoices);
    setSelectedPage(1);
    setPage(1);
    setInvoiceSearch("");
    setInvoiceSearch2("");
    setStatementDate(new Date(statementCreatedAt).toISOString().split("T")[0]);
    void fetchCustomerName();
    void fetchAvailableInvoices();
  }, [open, customerId, selectedInvoices, statementCreatedAt]);

  useEffect(() => {
    setPage(1);
  }, [invoiceSearch2]);

  useEffect(() => {
    setSelectedPage(1);
  }, [invoiceSearch]);

  // Filter selected invoices with search
  const filteredSelectedInvoices = currentInvoices.filter((inv) => {
    if (!invoiceSearch) return true;

    const searchLower = invoiceSearch.toLowerCase();
    const invoiceNoMatch = inv.invoiceNo.toString().includes(searchLower);
    const dateMatch = formatThaiDateLong(inv.createdAt)
      .toLowerCase()
      .includes(searchLower);
    const billIdMatch = inv.billId
      ? inv.billId.toString().includes(searchLower)
      : false;
    const totalMatch =
      inv.total.toString().includes(searchLower) ||
      inv.total.toLocaleString("th-TH").includes(searchLower);

    return invoiceNoMatch || dateMatch || billIdMatch || totalMatch;
  });

  const filteredInvoiceList = availableInvoices.filter((inv) => {
    if (currentInvoices.some((sel) => sel.id === inv.id)) return false;
    if (!invoiceSearch2) return true;

    const searchLower = invoiceSearch2.toLowerCase();
    const invoiceNoMatch = inv.invoiceNo.toString().includes(searchLower);
    const dateMatch = formatThaiDateLong(inv.createdAt)
      .toLowerCase()
      .includes(searchLower);
    const billIdMatch = inv.billId
      ? inv.billId.toString().includes(searchLower)
      : false;
    const totalMatch =
      inv.total.toString().includes(searchLower) ||
      inv.total.toLocaleString("th-TH").includes(searchLower);

    return invoiceNoMatch || dateMatch || billIdMatch || totalMatch;
  });
  const pagedInvoiceList = filteredInvoiceList.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const invoiceTotalPages =
    Math.ceil(filteredInvoiceList.length / pageSize) || 1;

  // Selected invoices pagination
  const pagedSelectedInvoices = filteredSelectedInvoices.slice(
    (selectedPage - 1) * pageSize,
    selectedPage * pageSize,
  );
  const selectedTotalPages =
    Math.ceil(filteredSelectedInvoices.length / pageSize) || 1;

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
          className="cursor-pointer border-zinc-600 text-zinc-100 hover:border-blue-500  "
        >
          <span className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all">
            <Edit size={18} />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2">
            <div className="flex gap-4">
              <span>แก้ไข Invoice ในใบเสร็จรับเงิน</span>{" "}
              <span className="text-blue-600 dark:text-blue-400">
                #
                {statementNo === null
                  ? "ยังไม่ได้กำหนดเลข"
                  : statementNo.toString()}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-4"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {/* Row: ค้นหา invoice */}
          <div className="flex flex-wrap gap-3 items-center rounded-xl px-4 py-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                ลูกค้า
              </span>
              <span className="inline-block bg-blue-600/90 text-white text-base font-bold rounded-lg px-3 py-1 shadow-sm">
                {customerName || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                เลือกแล้ว
              </span>
              <span className="inline-block bg-blue-600/90 text-white text-base font-bold rounded-lg px-3 py-1 shadow-sm">
                {currentInvoices.length} ใบ
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                วันที่ออกใบวางบิล
              </span>
              <Input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="h-9 w-45 rounded-lg border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900/70 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                ยอดรวม
              </span>
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
              <SearchDebounce
                placeholder="ค้นหาเลขที่ Invoice,วันที่ออก,เลขที่บิล,ยอดรวม"
                onSearchChange={setInvoiceSearch}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-red-300 dark:border-red-600/80 bg-red-100 dark:bg-red-700/60 text-red-700 dark:text-red-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-red-400 dark:hover:border-red-400 hover:bg-red-200 dark:hover:bg-red-600 hover:shadow-md active:scale-95"
              onClick={handleRemoveAll}
              disabled={currentInvoices.length === 0}
              aria-label="Remove all selected invoices"
              title="ลบทั้งหมด"
            >
              <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-gray-300 dark:border-zinc-600/80 bg-gray-100 dark:bg-zinc-700/60 text-gray-700 dark:text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-gray-400 dark:hover:border-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-600 hover:shadow-md active:scale-95"
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
            className="rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showSelectedTable && (
              <>
                <Table className="border border-gray-300 dark:border-zinc-600/90">
                  <TableHeader className="bg-gray-50 dark:bg-zinc-800/50">
                    <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่ Invoice
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        วันที่ออก
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่บิล
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        ยอดรวม
                      </TableHead>
                      <TableHead>ลบ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedSelectedInvoices.length === 0 ? (
                      <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-gray-300 dark:border-zinc-700/80 text-center text-gray-500 dark:text-zinc-400"
                        >
                          ยังไม่มีการเลือก
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedSelectedInvoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="border-b border-gray-200 dark:border-zinc-700/80 last:border-b-0"
                        >
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            HS{inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {formatThaiDateLong(inv.createdAt)}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.billId ?? "-"}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.total.toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
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
                <div className="py-4 px-6 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 mt-2 rounded-b-xl">
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    หน้า {selectedPage} จาก {selectedTotalPages} (ทั้งหมด{" "}
                    {filteredSelectedInvoices.length} รายการ)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
                      onClick={() => setSelectedPage(selectedPage - 1)}
                      disabled={selectedPage <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
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
              <SearchDebounce
                placeholder="ค้นหาเลขที่ Invoice,วันที่ออก,เลขที่บิล,ยอดรวม"
                onSearchChange={setInvoiceSearch2}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-green-300 dark:border-green-600/80 bg-green-100 dark:bg-green-700/60 text-green-700 dark:text-green-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-green-400 dark:hover:border-green-400 hover:bg-green-200 dark:hover:bg-green-600 hover:shadow-md active:scale-95"
              onClick={() => setMonthSelectionOpen(true)}
              disabled={filteredInvoiceList.length === 0}
              aria-label="Select all available invoices"
              title="เลือกทั้งหมด"
            >
              <CheckSquare className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-gray-300 dark:border-zinc-600/80 bg-gray-100 dark:bg-zinc-700/60 text-gray-700 dark:text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-gray-400 dark:hover:border-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-600 hover:shadow-md active:scale-95"
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
            className=" rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showAvailableTable && (
              <>
                <Table className="border border-gray-300 dark:border-zinc-600/90">
                  <TableHeader className="bg-gray-50 dark:bg-zinc-800/50">
                    <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่ Invoice
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        วันที่ออก
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่บิล
                      </TableHead>
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        ยอดรวม
                      </TableHead>
                      <TableHead>เลือก</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableLoading ? (
                      <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-gray-300 dark:border-zinc-700/80 text-center text-gray-500 dark:text-zinc-400"
                        >
                          กำลังโหลด...
                        </TableCell>
                      </TableRow>
                    ) : pagedInvoiceList.length === 0 ? (
                      <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                        <TableCell
                          colSpan={5}
                          className="border-x border-gray-300 dark:border-zinc-700/80 text-center text-gray-500 dark:text-zinc-400"
                        >
                          ไม่พบข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedInvoiceList.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="border-b border-gray-200 dark:border-zinc-700/80 last:border-b-0"
                        >
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            HS{inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {formatThaiDateLong(inv.createdAt)}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.billId ?? "-"}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.total.toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
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
                <div className="py-4 px-6 border-t border-zinc-700 flex items-center justify-between  mt-2 rounded-b-xl">
                  <span className="text-sm text-zinc-400">
                    หน้า {page} จาก {invoiceTotalPages} (ทั้งหมด{" "}
                    {filteredInvoiceList.length} รายการ)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className=" bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className=" bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
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
          <MonthSelectionModal
            open={monthSelectionOpen}
            onOpenChange={setMonthSelectionOpen}
            invoiceList={availableInvoices}
            selectedInvoices={currentInvoices}
            onConfirm={handleConfirmMonthSelection}
          />
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
