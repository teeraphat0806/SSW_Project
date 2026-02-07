"use client";
import { useEffect, useState, useMemo } from "react";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Loader2,
  History,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Employee } from "../../types/payroll";

interface SalaryHistory {
  id: number;
  staffId: number;
  amount: number;
  detail: string;
  effectiveDate: string;
  createdAt: string;
  staff?: {
    staffName?: string;
    user?: {
      name?: string;
    };
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function SalaryHistoryTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [usePagination, setUsePagination] = useState(true);

  // Fetch employees and salary history
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch employees
        const empRes = await fetch("/api/staff");
        const empData: Employee[] = await empRes.json();
        const employeesWithName = empData.map((e) => ({
          ...e,
          name: e.user?.name ?? e.staffName ?? "",
        }));
        setEmployees(employeesWithName);

        // Fetch salary history with pagination
        const url = usePagination
          ? `/api/staffSalary?page=${currentPage}&limit=${itemsPerPage}`
          : "/api/staffSalary";

        const historyRes = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const historyResponse = await historyRes.json();

        // Check if response has pagination metadata
        if (historyResponse.data && historyResponse.pagination) {
          setSalaryHistory(historyResponse.data);
          setPagination(historyResponse.pagination);
        } else {
          // Response is just an array (no pagination)
          setSalaryHistory(historyResponse);
          setPagination(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, usePagination]);

  // Process and filter salary history
  const displayData = useMemo(() => {
    let filtered = salaryHistory;

    // Filter by selected employee
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(
        (record) => String(record.staffId) === selectedEmployee,
      );
    }

    // Add employee name to each record
    const withEmployeeName = filtered.map((record) => {
      const employee = employees.find(
        (e) => String(e.id) === String(record.staffId),
      );
      return {
        ...record,
        employeeName:
          employee?.name ||
          record.staff?.user?.name ||
          record.staff?.staffName ||
          "ไม่ระบุ",
        employeeId: employee?.id || record.staffId,
      };
    });

    // Sort by employee name first, then by date (newest first)
    return withEmployeeName.sort((a, b) => {
      // If showing all employees, sort by name first
      if (selectedEmployee === "all") {
        const nameCompare = a.employeeName.localeCompare(b.employeeName, "th");
        if (nameCompare !== 0) return nameCompare;
      }
      // Then sort by date (newest first)
      return (
        new Date(b.effectiveDate || b.createdAt).getTime() -
        new Date(a.effectiveDate || a.createdAt).getTime()
      );
    });
  }, [salaryHistory, employees, selectedEmployee]);

  // Calculate dynamic table height based on number of rows
  const tableHeight = useMemo(() => {
    const rowHeight = 60; // approx height per row
    const headerHeight = 50;
    const maxHeight = 750; // Increased to fit 10 rows without scrollbar
    const minHeight = 200;

    const calculatedHeight = Math.min(
      maxHeight,
      Math.max(minHeight, displayData.length * rowHeight + headerHeight),
    );

    return `${calculatedHeight}px`;
  }, [displayData.length]);

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2 flex flex-col">
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
                    {selectedEmployee === "all" ? (
                      <>
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <span className="text-muted-foreground">
                          ชื่อพนักงาน
                        </span>
                      </>
                    ) : (
                      employees.find(
                        (emp) => String(emp.id) === selectedEmployee,
                      )?.name || "เลือกพนักงาน"
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
                      <CommandEmpty className="text-center py-6 text-muted-foreground">
                        ไม่พบพนักงาน
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedEmployee("all");
                            setOpen(false);
                          }}
                          className={cn(
                            "cursor-pointer bg-white dark:bg-zinc-900",
                            "hover:bg-blue-50 dark:hover:bg-blue-950",
                            "aria-selected:bg-blue-100 dark:aria-selected:bg-blue-900",
                            selectedEmployee === "all" &&
                              "bg-blue-50 dark:bg-blue-950",
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedEmployee === "all"
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="font-medium">ทั้งหมด</span>
                        </CommandItem>
                        {employees.map((emp) => (
                          <CommandItem
                            key={emp.id}
                            value={emp.name}
                            onSelect={() => {
                              setSelectedEmployee(String(emp.id));
                              setOpen(false);
                            }}
                            className={cn(
                              "cursor-pointer bg-white dark:bg-zinc-900",
                              "hover:bg-blue-50 dark:hover:bg-blue-950",
                              "aria-selected:bg-blue-100 dark:aria-selected:bg-blue-900",
                              selectedEmployee === String(emp.id) &&
                                "bg-blue-50 dark:bg-blue-950",
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEmployee === String(emp.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {emp.name}
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
      </div>

      {/* Table */}
      {displayData.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <p className="text-muted-foreground">
            ไม่พบข้อมูลประวัติการปรับเงินเดือน
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <ScrollArea style={{ height: tableHeight }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-10">
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-center">
                        ลำดับ
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        พนักงาน
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">
                        จำนวนเงิน
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        รายละเอียด
                      </th>
                      <th className="py-4 px-6 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        วันที่ปรับ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {displayData.map((record, index) => {
                      const rowNumber =
                        usePagination && pagination
                          ? (currentPage - 1) * itemsPerPage + index + 1
                          : index + 1;

                      return (
                        <tr
                          key={record.id}
                          className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer"
                        >
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                              {rowNumber}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {record.employeeName}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {record.amount >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span
                                className={`font-mono text-sm font-bold ${
                                  record.amount >= 0
                                    ? "text-green-600 dark:text-green-500"
                                    : "text-red-600 dark:text-red-500"
                                }`}
                              >
                                {record.amount >= 0 ? "+" : ""}฿
                                {Math.abs(record.amount).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                              {record.detail || "-"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                              {new Date(
                                record.effectiveDate || record.createdAt,
                              ).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {/* Pagination Controls */}
            {pagination && usePagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-sm text-muted-foreground">
                  หน้า {pagination.page} จาก {pagination.totalPages} (
                  {pagination.total} รายการ)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
