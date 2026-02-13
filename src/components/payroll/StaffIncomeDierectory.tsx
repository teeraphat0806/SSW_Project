"use client";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Types for StaffIncome
interface StaffIncomeData {
  id: number;
  staffId: number;
  typeId: number;
  nameIncome: string;
  amount: number;
  detail: string | null;
  date: string;
  staffName: string | null;
  Staff: {
    bankAccount: string | null;
    startDate: string;
    code: string;
    social_security: string | null;
    currentSalary: number;
    user: {
      name: string;
    } | null;
    jobPosition?: {
      id: number;
      name: string;
      baseSalary: number;
    } | null;
  } | null;
}

interface Staff {
  id: number;
  userId: number;
  code: string;
  staffName: string | null;
  user: {
    name: string;
  } | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function StaffIncomeDirectory() {
  const [staffIncomes, setStaffIncomes] = useState<StaffIncomeData[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<StaffIncomeData | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const limit = 10; // Items per page

  // Fetch staff list for dropdown
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const response = await fetch("/api/staff", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStaffList(data);
        }
      } catch (error) {
        console.error("Error fetching staff list:", error);
      }
    };
    fetchStaffList();
  }, []);

  // Fetch staff income data
  useEffect(() => {
    const fetchStaffIncomes = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          page: currentPage.toString(),
        });

        if (selectedStaffId !== "all") {
          params.append("staffId", selectedStaffId);
        }

        const response = await fetch(`/api/staffIncome?${params.toString()}`, {
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          setStaffIncomes(result.data);
          setPagination(result.pagination);
        }
      } catch (error) {
        console.error("Error fetching staff incomes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffIncomes();
  }, [currentPage, selectedStaffId]);

  const handleViewDetails = (income: StaffIncomeData) => {
    setSelectedIncome(income);
    setIsDetailsOpen(true);
  };

  const handleStaffChange = (value: string) => {
    setSelectedStaffId(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              เลือกพนักงาน
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[300px] justify-start"
                >
                  {selectedStaffId === "all" ? (
                    <>
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <span className="text-muted-foreground">ชื่อพนักงาน</span>
                    </>
                  ) : (
                    staffList.find(
                      (staff) => staff.id.toString() === selectedStaffId,
                    )?.staffName ||
                    staffList.find(
                      (staff) => staff.id.toString() === selectedStaffId,
                    )?.user?.name ||
                    "เลือกพนักงาน"
                  )}
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[300px] p-0 bg-white dark:bg-zinc-900"
                align="start"
              >
                <Command className="bg-white dark:bg-zinc-900">
                  <CommandInput
                    placeholder="ค้นหาพนักงาน..."
                    className="bg-white dark:bg-zinc-900"
                  />
                  <CommandList className="bg-white dark:bg-zinc-900">
                    <CommandEmpty>ไม่พบพนักงาน</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          handleStaffChange("all");
                          setOpen(false);
                        }}
                        className={cn(
                          "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950",
                          selectedStaffId === "all" &&
                            "bg-blue-50 dark:bg-blue-950",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedStaffId === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        แสดงทั้งหมด
                      </CommandItem>
                      {staffList.map((staff) => (
                        <CommandItem
                          key={staff.id}
                          value={staff.staffName || staff.user?.name || ""}
                          onSelect={() => {
                            handleStaffChange(staff.id.toString());
                            setOpen(false);
                          }}
                          className={cn(
                            "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950",
                            selectedStaffId === staff.id.toString() &&
                              "bg-blue-50 dark:bg-blue-950",
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStaffId === staff.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {staff.staffName || staff.user?.name || "ไม่ระบุชื่อ"}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Badge variant="secondary" className="rounded-full mt-6">
            พบ {pagination.total} รายการ
          </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  ลำดับ
                </th>

                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  พนักงาน
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  รายการ
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                  จำนวนเงิน
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                  รายละเอียด
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    กำลังโหลด...
                  </td>
                </tr>
              ) : staffIncomes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                staffIncomes.map((income, idx) => (
                  <tr
                    key={income.id}
                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewDetails(income)}
                  >
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {(currentPage - 1) * limit + idx + 1}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {income.staffName ||
                          income.Staff?.user?.name ||
                          "ไม่ระบุชื่อ"}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {income.nameIncome}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">
                        {income.amount?.toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB",
                        })}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {(() => {
                          const date = new Date(income.date);
                          const day = date.getDate();
                          const month = date.toLocaleDateString("th-TH", {
                            month: "long",
                          });
                          const year = date.getFullYear() + 543;
                          return `${day} ${month} ${year}`;
                        })()}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        className="p-2 rounded-lg flex flex-row items-center gap-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all mx-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(income);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!isLoading && staffIncomes.length > 0 && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              หน้า {currentPage} จาก {pagination.totalPages} &nbsp; (
              {pagination.total} รายการ)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดรายได้พนักงาน</DialogTitle>
          </DialogHeader>

          {selectedIncome && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ชื่อพนักงาน</p>
                <p className="font-semibold">
                  {selectedIncome.staffName ||
                    selectedIncome.Staff?.user?.name ||
                    "ไม่ระบุชื่อ"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                <p className="font-semibold">
                  {selectedIncome.Staff?.user && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedIncome.Staff?.jobPosition?.name || "-"}{" "}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  เงินเดือนปัจจุบัน
                </p>
                <p className="font-semibold">
                  {selectedIncome.Staff?.currentSalary?.toLocaleString(
                    "th-TH",
                    {
                      style: "currency",
                      currency: "THB",
                    },
                  )}
                </p>
              </div>
              <div className="col-span-2 border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  รายละเอียดรายได้
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">รายการ</p>
                <p className="font-semibold">{selectedIncome.nameIncome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวนเงิน</p>
                <p className="font-semibold text-green-600">
                  {selectedIncome.amount?.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันที่</p>
                <p className="font-semibold">
                  {(() => {
                    const date = new Date(selectedIncome.date);
                    const day = date.getDate();
                    const month = date.toLocaleDateString("th-TH", {
                      month: "long",
                    });
                    const year = date.getFullYear() + 543;
                    return `${day} ${month} พ.ศ. ${year}`;
                  })()}
                </p>
              </div>
              {selectedIncome.detail && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">หมายเหตุ</p>
                  <p className="font-semibold">{selectedIncome.detail}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
