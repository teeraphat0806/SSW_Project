import React, { useEffect, useState } from "react";
import {
  Trash2,
  Check,
  ArrowRightLeft,
  FilePlus2,
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
import SelectCustomer from "../SelectCustomer";
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
import { useRouter } from "next/navigation";
interface CustomerOption {
  id: number;
  name: string;
}
interface InvoiceItem {
  id: number;
  invoiceNo: number;
  total: number;
  createdAt: string;
  billId?: number | null;
}

interface InvoiceApiItem {
  id: number;
  invoiceNo: number | string;
  total?: number | string | null;
  grandTotal?: number | string | null;
  billId?: number | string | null;
  createdAt: string;
}

interface CreateAcquittanceDialogProps {
  customers: CustomerOption[];
  onCreate: (data: {
    customerId: number;
    date: string;
    invoiceIds: number[];
  }) => void;
  loading: boolean;
}

export default function CreateAcquittanceDialog({
  customers,
  onCreate,
  loading,
}: CreateAcquittanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<
    string | number | null
  >(null);
  const [date, setDate] = useState("");
  const [selectedInvoiceSearch, setSelectedInvoiceSearch] = useState("");
  const [availableInvoiceSearch, setAvailableInvoiceSearch] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceList, setInvoiceList] = useState<InvoiceItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showSelectedTable, setShowSelectedTable] = useState(true);
  const [showSelectedTable2, setShowSelectedTable2] = useState(true);
  const [selectedPage, setSelectedPage] = useState(1);
  const router = useRouter();
  useEffect(() => {
    if (selectedCustomer) {
      setInvoiceList([]);
      setSelectedInvoices([]);
      setPage(1);
      setSelectedPage(1);
      setSelectedInvoiceSearch("");
      setAvailableInvoiceSearch("");
      const fetchInvoices = async () => {
        try {
          const customer = customers.find(
            (c) => c.id === Number(selectedCustomer),
          );
          if (!customer) {
            console.error("Customer not found");
            setInvoiceList([]);
            return;
          }
          const res = await fetch(`/api/invoice/customer/${customer.id}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch invoices: ${res.status}`);
          }
          const data = await res.json();
          const items: InvoiceApiItem[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
              ? data.items
              : [];

          const normalizedInvoices: InvoiceItem[] = items.map((item) => ({
            id: Number(item.id),
            invoiceNo: Number(item.invoiceNo),
            total: Number(item.total ?? item.grandTotal ?? 0),
            billId: Number(item.billId) || null,
            createdAt: item.createdAt,
          }));

          setInvoiceList(normalizedInvoices);
        } catch (error) {
          console.error("Error fetching invoices:", error);
          setInvoiceList([]);
        }
      };
      fetchInvoices();
    } else {
      setInvoiceList([]);
      setSelectedInvoices([]);
      setPage(1);
      setSelectedPage(1);
      setSelectedInvoiceSearch("");
      setAvailableInvoiceSearch("");
    }
  }, [selectedCustomer, customers]);

  useEffect(() => {
    setPage(1);
  }, [availableInvoiceSearch]);

  useEffect(() => {
    setSelectedPage(1);
  }, [selectedInvoiceSearch]);

  const totalIncome = selectedInvoices.reduce(
    (sum, inv) => sum + Number(inv.total ?? 0),
    0,
  );

  const handleRemoveAll = () => {
    setSelectedInvoices([]);
  };

  const handleSelectAll = () => {
    const newInvoices = filteredInvoiceList.filter(
      (inv) => !selectedInvoices.some((sel) => sel.id === inv.id),
    );
    setSelectedInvoices([...selectedInvoices, ...newInvoices]);
  };

  // Filter selected invoices table with its own search
  const filteredSelectedInvoices = selectedInvoices.filter((inv) => {
    if (!selectedInvoiceSearch) return true;

    const searchLower = selectedInvoiceSearch.toLowerCase();
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

  // Filter invoiceList: remove those already selected and apply search
  const filteredInvoiceList = invoiceList.filter((inv) => {
    if (selectedInvoices.some((sel) => sel.id === inv.id)) return false;
    if (!availableInvoiceSearch) return true;

    const searchLower = availableInvoiceSearch.toLowerCase();
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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-4">
        <Button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-white inline-flex items-center gap-2"
          onClick={() => router.push("/statement")}
        >
          <ArrowRightLeft className="h-4 w-4" />
          สลับเป็นใบเสร็จรับเงิน
        </Button>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2">
            <FilePlus2 className="h-4 w-4" />
            สร้างใบวางบิล
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-2">
            สร้างใบวางบิลใหม่
          </DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-4"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {/* Row: ลูกค้า, วันที่, ยอดรวม, หมายเหตุ */}
          <div className="flex flex-wrap gap-3 items-center rounded-2xl bg-gray-50 dark:bg-zinc-800 p-4">
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
                className="w-36 bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs mb-1">เลือกแล้ว</span>
              <div className="bg-gray-100 dark:bg-zinc-800 rounded px-3 py-1 min-w-15 text-center">
                {selectedInvoices.length} ใบ
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs mb-1">ยอดรวม (ประมาณ)</span>
              <div className="bg-gray-100 dark:bg-zinc-800 rounded px-3 py-1 min-w-25 text-center">
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
              <SearchDebounce
                placeholder="ค้นหาเลขที่ใบวางบิล,วันที่ออก,เลขที่บิล,ยอดรวม"
                onSearchChange={setSelectedInvoiceSearch}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-red-300 dark:border-red-600/80 bg-red-100 dark:bg-red-700/60 text-red-700 dark:text-red-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-red-400 dark:hover:border-red-400 hover:bg-red-200 dark:hover:bg-red-600 hover:shadow-md active:scale-95"
              onClick={handleRemoveAll}
              disabled={selectedInvoices.length === 0}
              aria-label="Remove all selected invoices"
              title="ลบทั้งหมด"
            >
              <X className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
            </Button>
            <div className="flex items-center justify-between mb-2">
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
          </div>

          <div
            className="bg-gray-50 dark:bg-zinc-800 rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showSelectedTable && (
              <>
                <Table className="border border-gray-300 dark:border-zinc-600/90">
                  <TableHeader className="bg-gray-100 dark:bg-zinc-700/40">
                    <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่ใบวางบิล
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
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {formatThaiDateLong(inv.createdAt)}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.billId ?? "-"}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {Number(inv.total ?? 0).toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
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
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">Invoice ที่เลือกได้</span>
            <div className="ml-auto relative w-full max-w-xs">
              <SearchDebounce
                placeholder="ค้นหาเลขที่ใบวางบิล,วันที่ออก,เลขที่บิล,ยอดรวม"
                onSearchChange={setAvailableInvoiceSearch}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="group h-8 w-8 rounded-full border border-green-300 dark:border-green-600/80 bg-green-100 dark:bg-green-700/60 text-green-700 dark:text-green-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-green-400 dark:hover:border-green-400 hover:bg-green-200 dark:hover:bg-green-600 hover:shadow-md active:scale-95"
              onClick={handleSelectAll}
              disabled={filteredInvoiceList.length === 0}
              aria-label="Select all available invoices"
              title="เลือกทั้งหมด"
            >
              <CheckSquare className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </Button>
            <div className="flex items-center justify-between mb-2">
              <Button
                size="icon"
                variant="ghost"
                className="group h-8 w-8 rounded-full border border-gray-300 dark:border-zinc-600/80 bg-gray-100 dark:bg-zinc-700/60 text-gray-700 dark:text-zinc-100 shadow-sm transition-all duration-200 hover:scale-105 hover:border-gray-400 dark:hover:border-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-600 hover:shadow-md active:scale-95"
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
            className="bg-gray-50 dark:bg-zinc-800 rounded-xl mt-2"
            style={{ maxHeight: 260, overflowY: "auto" }}
          >
            {showSelectedTable2 && (
              <>
                <Table className="border border-gray-300 dark:border-zinc-600/90">
                  <TableHeader className="bg-gray-100 dark:bg-zinc-700/40">
                    <TableRow className="border-b border-gray-300 dark:border-zinc-600/90">
                      <TableHead className="border-r border-gray-300 dark:border-zinc-600/90">
                        เลขที่ใบวางบิล
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
                    {pagedInvoiceList.length === 0 ? (
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
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {formatThaiDateLong(inv.createdAt)}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {inv.billId ?? "-"}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
                            {Number(inv.total ?? 0).toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB",
                            })}
                          </TableCell>
                          <TableCell className="border-r border-gray-200 dark:border-zinc-700/80">
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

                <div className="py-4 px-6 border-t border-gray-200 dark:border-zinc-700 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50 mt-2 rounded-b-xl">
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    หน้า {page} จาก {invoiceTotalPages} (ทั้งหมด{" "}
                    {filteredInvoiceList.length} รายการ)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
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
          <div className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
            เลือก ลูกค้า → เลือก invoice → กด "สร้างใบวางบิล" – (Fake)
            จะสร้างเลข InvoiceNo ให้เอง
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
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
