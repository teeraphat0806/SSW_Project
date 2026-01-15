import type { Bill } from "@/types/bill";
import type { Customer } from "@/types/customer";
import { formatCurrency, formatDate } from "./analytics-utils";

export interface PrintRowData {
  rowNumber: number;
  saleDate: Date;
  invoiceNo: string;
  customerName: string;
  salesAmount: number;
}

export interface MonthlyPrintData {
  rows: PrintRowData[];
  totalSales: number;
  totalOrders: number;
}

export interface YearlyPrintData {
  months: {
    month: number;
    monthName: string;
    rows: PrintRowData[];
    subtotal: number;
    orderCount: number;
  }[];
  yearlyTotal: number;
  yearlyOrderCount: number;
}

type SortOrder = "date-asc" | "date-desc" | "sales-asc" | "sales-desc";

function getBillDate(bill: Bill): Date | null {
  const raw = bill.createdAt;
  if (!raw) return null;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getThaiMonthName(month: number): string {
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return months[month - 1] || "";
}

function sortRows(rows: PrintRowData[], sortOrder: SortOrder): PrintRowData[] {
  const sorted = [...rows];
  switch (sortOrder) {
    case "date-asc":
      return sorted.sort((a, b) => a.saleDate.getTime() - b.saleDate.getTime());
    case "date-desc":
      return sorted.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
    case "sales-asc":
      return sorted.sort((a, b) => a.salesAmount - b.salesAmount);
    case "sales-desc":
      return sorted.sort((a, b) => b.salesAmount - a.salesAmount);
    default:
      return sorted;
  }
}

export function getMonthlyPrintData(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  month: number;
  customerId?: string;
  sortOrder?: SortOrder;
}): MonthlyPrintData {
  const {
    bills,
    customers,
    year,
    month,
    customerId = "all",
    sortOrder = "date-desc",
  } = params;

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date }) => {
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  if (customerId !== "all") {
    const customerIdNum = Number.parseInt(customerId);
    filteredBills = filteredBills.filter(
      ({ bill }) => bill.customerId === customerIdNum
    );
  }

  let rows: PrintRowData[] = filteredBills.map(({ bill, date }) => {
    const customer = customers.find((c) => c.id === bill.customerId);
    return {
      rowNumber: 0,
      saleDate: date,
      invoiceNo:
        bill.invoiceNo !== undefined && bill.invoiceNo !== null
          ? String(bill.invoiceNo)
          : "-",
      customerName: customer?.name || "-",
      salesAmount: Number(bill.grandTotal ?? bill.subtotal ?? 0),
    };
  });

  rows = sortRows(rows, sortOrder);

  rows = rows.map((row, index) => ({
    ...row,
    rowNumber: index + 1,
  }));

  const totalSales = rows.reduce((sum, row) => sum + row.salesAmount, 0);

  return {
    rows,
    totalSales,
    totalOrders: rows.length,
  };
}

export function getYearlyPrintData(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  customerId?: string;
  sortOrder?: SortOrder;
}): YearlyPrintData {
  const {
    bills,
    customers,
    year,
    customerId = "all",
    sortOrder = "date-desc",
  } = params;

  const months = [] as YearlyPrintData["months"];
  let yearlyTotal = 0;
  let yearlyOrderCount = 0;

  for (let month = 1; month <= 12; month++) {
    let filteredBills = bills
      .map((bill) => ({ bill, date: getBillDate(bill) }))
      .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

    filteredBills = filteredBills.filter(({ date }) => {
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    if (customerId !== "all") {
      const customerIdNum = Number.parseInt(customerId);
      filteredBills = filteredBills.filter(
        ({ bill }) => bill.customerId === customerIdNum
      );
    }

    let rows: PrintRowData[] = filteredBills.map(({ bill, date }) => {
      const customer = customers.find((c) => c.id === bill.customerId);
      return {
        rowNumber: 0,
        saleDate: date,
        invoiceNo:
          bill.invoiceNo !== undefined && bill.invoiceNo !== null
            ? String(bill.invoiceNo)
            : "-",
        customerName: customer?.name || "-",
        salesAmount: Number(bill.grandTotal ?? bill.subtotal ?? 0),
      };
    });

    rows = sortRows(rows, sortOrder);

    rows = rows.map((row, index) => ({
      ...row,
      rowNumber: index + 1,
    }));

    const subtotal = rows.reduce((sum, row) => sum + row.salesAmount, 0);

    months.push({
      month,
      monthName: getThaiMonthName(month),
      rows,
      subtotal,
      orderCount: rows.length,
    });

    yearlyTotal += subtotal;
    yearlyOrderCount += rows.length;
  }

  return {
    months,
    yearlyTotal,
    yearlyOrderCount,
  };
}

export { formatCurrency, formatDate };
