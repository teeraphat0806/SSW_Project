// Note: Print utilities currently use empty mock data stubs
// To use with real data, pass bills and customers as parameters to the functions

// Mock data stubs for print utilities
const mockBills: any[] = [];
const mockCustomers: any[] = [];
import { formatCurrency, formatDate } from "./analytics-utils";

export interface PrintRowData {
  rowNumber: number;
  saleDate: Date;
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

export function getMonthlyPrintData(
  year: number,
  month: number,
  customerId = "all",
  sortOrder: SortOrder = "date-desc"
): MonthlyPrintData {
  let bills = mockBills.filter((bill) => {
    const date = bill.dateReceive || bill.deliveryDate;
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  // Filter by customer if specified
  if (customerId !== "all") {
    const customerIdNum = Number.parseInt(customerId);
    bills = bills.filter((bill) => bill.customerId === customerIdNum);
  }

  // Transform to print rows
  let rows: PrintRowData[] = bills.map((bill) => {
    const customer = mockCustomers.find((c) => c.id === bill.customerId);
    return {
      rowNumber: 0, // Will be assigned after sorting
      saleDate: bill.dateReceive || bill.deliveryDate,
      customerName: customer?.name || "-",
      salesAmount: bill.grandTotal || bill.subtotal || 0,
    };
  });

  // Sort rows
  rows = sortRows(rows, sortOrder);

  // Assign row numbers after sorting
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

export function getYearlyPrintData(
  year: number,
  customerId = "all",
  sortOrder: SortOrder = "date-desc"
): YearlyPrintData {
  const months = [];
  let yearlyTotal = 0;
  let yearlyOrderCount = 0;

  for (let month = 1; month <= 12; month++) {
    let bills = mockBills.filter((bill) => {
      const date = bill.dateReceive || bill.deliveryDate;
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    // Filter by customer if specified
    if (customerId !== "all") {
      const customerIdNum = Number.parseInt(customerId);
      bills = bills.filter((bill) => bill.customerId === customerIdNum);
    }

    // Transform to print rows
    let rows: PrintRowData[] = bills.map((bill) => {
      const customer = mockCustomers.find((c) => c.id === bill.customerId);
      return {
        rowNumber: 0, // Will be assigned after sorting
        saleDate: bill.dateReceive || bill.deliveryDate,
        customerName: customer?.name || "-",
        salesAmount: bill.grandTotal || bill.subtotal || 0,
      };
    });

    // Sort rows
    rows = sortRows(rows, sortOrder);

    // Assign row numbers after sorting
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
