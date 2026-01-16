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

export interface BillData {
  customerName: string;
  customerId: number | null;
  data: MonthlyPrintData | YearlyPrintData;
  type: "monthly" | "yearly";
  year: number;
  month?: number;
}

export interface ReceiptData {
  customerName: string;
  customerId: number | null;
  customerInfo?: {
    name: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
  data: MonthlyPrintData | YearlyPrintData;
  type: "monthly" | "yearly";
  year: number;
  month?: number;
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

export function getMonthlyPrintDataByCustomer(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  month: number;
  sortOrder?: SortOrder;
}): BillData[] {
  const { bills, customers, year, month, sortOrder = "date-desc" } = params;

  // Group bills by customer
  const billsByCustomer = new Map<number, { bill: Bill; date: Date }[]>();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date }) => {
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  // Group by customer
  for (const entry of filteredBills) {
    const customerId = entry.bill.customerId;
    if (customerId === null || customerId === undefined) continue;
    if (!billsByCustomer.has(customerId)) {
      billsByCustomer.set(customerId, []);
    }
    billsByCustomer.get(customerId)!.push(entry);
  }

  // Create separate bill for each customer
  const result: BillData[] = [];
  for (const [customerId, customerBills] of billsByCustomer.entries()) {
    const customer = customers.find((c) => c.id === customerId);
    let rows: PrintRowData[] = customerBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerId,
      type: "monthly",
      year,
      month,
      data: {
        rows,
        totalSales,
        totalOrders: rows.length,
      },
    });
  }

  return result;
}

export function getYearlyPrintDataByCustomerAndMonth(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  sortOrder?: SortOrder;
}): BillData[] {
  const { bills, customers, year, sortOrder = "date-desc" } = params;

  // Group bills by customer and month
  const billsByCustomerAndMonth = new Map<
    string,
    { customerId: number; month: number; bills: { bill: Bill; date: Date }[] }
  >();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date }) => {
    return date.getFullYear() === year;
  });

  // Group by customer and month
  for (const entry of filteredBills) {
    const customerId = entry.bill.customerId;
    if (customerId === null || customerId === undefined) continue;
    const month = entry.date.getMonth() + 1;
    const key = `${customerId}-${month}`;

    if (!billsByCustomerAndMonth.has(key)) {
      billsByCustomerAndMonth.set(key, {
        customerId,
        month,
        bills: [],
      });
    }
    billsByCustomerAndMonth.get(key)!.bills.push(entry);
  }

  // Create separate bill for each customer-month combination
  const result: BillData[] = [];

  // Sort by month first, then by customer
  const sortedKeys = Array.from(billsByCustomerAndMonth.keys()).sort((a, b) => {
    const [aCustomerId, aMonth] = a.split("-").map(Number);
    const [bCustomerId, bMonth] = b.split("-").map(Number);
    if (aMonth !== bMonth) return aMonth - bMonth;
    return aCustomerId - bCustomerId;
  });

  for (const key of sortedKeys) {
    const {
      customerId,
      month: billMonth,
      bills: customerBills,
    } = billsByCustomerAndMonth.get(key)!;
    const customer = customers.find((c) => c.id === customerId);

    let rows: PrintRowData[] = customerBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerId,
      type: "yearly",
      year,
      month: billMonth,
      data: {
        months: [
          {
            month: billMonth,
            monthName: getThaiMonthName(billMonth),
            rows,
            subtotal,
            orderCount: rows.length,
          },
        ],
        yearlyTotal: subtotal,
        yearlyOrderCount: rows.length,
      },
    });
  }

  return result;
}

export function getYearlyPrintDataByMonth(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  customerId: string;
  sortOrder?: SortOrder;
}): BillData[] {
  const {
    bills,
    customers,
    year,
    customerId,
    sortOrder = "date-desc",
  } = params;

  const customerIdNum = Number.parseInt(customerId);
  const customer = customers.find((c) => c.id === customerIdNum);

  // Group bills by month
  const billsByMonth = new Map<number, { bill: Bill; date: Date }[]>();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date, bill }) => {
    return date.getFullYear() === year && bill.customerId === customerIdNum;
  });

  // Group by month
  for (const entry of filteredBills) {
    const month = entry.date.getMonth() + 1;
    if (!billsByMonth.has(month)) {
      billsByMonth.set(month, []);
    }
    billsByMonth.get(month)!.push(entry);
  }

  // Create separate bill for each month
  const result: BillData[] = [];

  // Sort by month
  const sortedMonths = Array.from(billsByMonth.keys()).sort((a, b) => a - b);

  for (const month of sortedMonths) {
    const monthBills = billsByMonth.get(month)!;

    let rows: PrintRowData[] = monthBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerIdNum,
      type: "yearly",
      year,
      month,
      data: {
        months: [
          {
            month,
            monthName: getThaiMonthName(month),
            rows,
            subtotal,
            orderCount: rows.length,
          },
        ],
        yearlyTotal: subtotal,
        yearlyOrderCount: rows.length,
      },
    });
  }

  return result;
}

// Receipt functions - similar to Bill functions but with customer info
export function getMonthlyReceiptDataByCustomer(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  month: number;
  sortOrder?: SortOrder;
}): ReceiptData[] {
  const { bills, customers, year, month, sortOrder = "date-desc" } = params;

  // Group bills by customer
  const billsByCustomer = new Map<number, { bill: Bill; date: Date }[]>();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date }) => {
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  // Group by customer
  for (const entry of filteredBills) {
    const customerId = entry.bill.customerId;
    if (customerId === null || customerId === undefined) continue;
    if (!billsByCustomer.has(customerId)) {
      billsByCustomer.set(customerId, []);
    }
    billsByCustomer.get(customerId)!.push(entry);
  }

  // Create separate receipt for each customer
  const result: ReceiptData[] = [];
  for (const [customerId, customerBills] of billsByCustomer.entries()) {
    const customer = customers.find((c) => c.id === customerId);
    let rows: PrintRowData[] = customerBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerId,
      customerInfo: customer
        ? {
            name: customer.name,
            address: (customer as any).address,
            phone: (customer as any).tel,
            taxId: (customer as any).taxNumber,
          }
        : undefined,
      type: "monthly",
      year,
      month,
      data: {
        rows,
        totalSales,
        totalOrders: rows.length,
      },
    });
  }

  return result;
}

export function getYearlyReceiptDataByCustomerAndMonth(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  sortOrder?: SortOrder;
}): ReceiptData[] {
  const { bills, customers, year, sortOrder = "date-desc" } = params;

  // Group bills by customer and month
  const billsByCustomerAndMonth = new Map<
    string,
    { customerId: number; month: number; bills: { bill: Bill; date: Date }[] }
  >();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date }) => {
    return date.getFullYear() === year;
  });

  // Group by customer and month
  for (const entry of filteredBills) {
    const customerId = entry.bill.customerId;
    if (customerId === null || customerId === undefined) continue;
    const month = entry.date.getMonth() + 1;
    const key = `${customerId}-${month}`;

    if (!billsByCustomerAndMonth.has(key)) {
      billsByCustomerAndMonth.set(key, {
        customerId,
        month,
        bills: [],
      });
    }
    billsByCustomerAndMonth.get(key)!.bills.push(entry);
  }

  // Create separate receipt for each customer-month combination
  const result: ReceiptData[] = [];

  // Sort by month first, then by customer
  const sortedKeys = Array.from(billsByCustomerAndMonth.keys()).sort((a, b) => {
    const [aCustomerId, aMonth] = a.split("-").map(Number);
    const [bCustomerId, bMonth] = b.split("-").map(Number);
    if (aMonth !== bMonth) return aMonth - bMonth;
    return aCustomerId - bCustomerId;
  });

  for (const key of sortedKeys) {
    const {
      customerId,
      month: billMonth,
      bills: customerBills,
    } = billsByCustomerAndMonth.get(key)!;
    const customer = customers.find((c) => c.id === customerId);

    let rows: PrintRowData[] = customerBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerId,
      customerInfo: customer
        ? {
            name: customer.name,
            address: (customer as any).address,
            phone: (customer as any).tel,
            taxId: (customer as any).taxNumber,
          }
        : undefined,
      type: "yearly",
      year,
      month: billMonth,
      data: {
        months: [
          {
            month: billMonth,
            monthName: getThaiMonthName(billMonth),
            rows,
            subtotal,
            orderCount: rows.length,
          },
        ],
        yearlyTotal: subtotal,
        yearlyOrderCount: rows.length,
      },
    });
  }

  return result;
}

export function getYearlyReceiptDataByMonth(params: {
  bills: Bill[];
  customers: Customer[];
  year: number;
  customerId: string;
  sortOrder?: SortOrder;
}): ReceiptData[] {
  const {
    bills,
    customers,
    year,
    customerId,
    sortOrder = "date-desc",
  } = params;

  const customerIdNum = Number.parseInt(customerId);
  const customer = customers.find((c) => c.id === customerIdNum);

  // Group bills by month
  const billsByMonth = new Map<number, { bill: Bill; date: Date }[]>();

  let filteredBills = bills
    .map((bill) => ({ bill, date: getBillDate(bill) }))
    .filter((entry) => entry.date !== null) as { bill: Bill; date: Date }[];

  filteredBills = filteredBills.filter(({ date, bill }) => {
    return date.getFullYear() === year && bill.customerId === customerIdNum;
  });

  // Group by month
  for (const entry of filteredBills) {
    const month = entry.date.getMonth() + 1;
    if (!billsByMonth.has(month)) {
      billsByMonth.set(month, []);
    }
    billsByMonth.get(month)!.push(entry);
  }

  // Create separate receipt for each month
  const result: ReceiptData[] = [];

  // Sort by month
  const sortedMonths = Array.from(billsByMonth.keys()).sort((a, b) => a - b);

  for (const month of sortedMonths) {
    const monthBills = billsByMonth.get(month)!;

    let rows: PrintRowData[] = monthBills.map(({ bill, date }) => {
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

    result.push({
      customerName: customer?.name || "-",
      customerId: customerIdNum,
      customerInfo: customer
        ? {
            name: customer.name,
            address: (customer as any).address,
            phone: (customer as any).tel,
            taxId: (customer as any).taxNumber,
          }
        : undefined,
      type: "yearly",
      year,
      month,
      data: {
        months: [
          {
            month,
            monthName: getThaiMonthName(month),
            rows,
            subtotal,
            orderCount: rows.length,
          },
        ],
        yearlyTotal: subtotal,
        yearlyOrderCount: rows.length,
      },
    });
  }

  return result;
}

export { formatCurrency, formatDate };
