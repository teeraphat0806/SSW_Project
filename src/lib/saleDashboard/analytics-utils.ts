import type { Bill } from "@/types/bill";
import type { Customer } from "@/types/customer";
import type { Expense } from "@/types/expense";
import type { ExpenseCategory } from "@/types/expenseCategory";
import type { OrderPO } from "@/types/orderPO";
import type { Staff } from "@/types/staff";
import type { StaffIncome } from "@/types/staffIncome";
import type { StaffSalary } from "@/types/staffSalary";
import type { TypeStaffIncome } from "@/types/typeStaffIncome";

export interface AnalyticsDataSources {
  bills: Bill[];
  orders: OrderPO[];
  expenses: Expense[];
  staffIncomes: StaffIncome[];
  staffSalaries: StaffSalary[];
  customers: Customer[];
  staff: Staff[];
  expenseCategories: ExpenseCategory[];
  typeStaffIncome: TypeStaffIncome[];
}

const emptySources: AnalyticsDataSources = {
  bills: [],
  orders: [],
  expenses: [],
  staffIncomes: [],
  staffSalaries: [],
  customers: [],
  staff: [],
  expenseCategories: [],
  typeStaffIncome: [],
};

const useSources = (sources?: AnalyticsDataSources): AnalyticsDataSources =>
  sources ?? emptySources;

// Date utilities
export function getYear(date: Date): number {
  return date.getFullYear();
}

export function getMonth(date: Date): number {
  return date.getMonth() + 1; // 1-12
}

export function getMonthName(month: number): string {
  const thaiMonths = [
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
  return thaiMonths[month - 1] || "";
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("th-TH").format(num);
}

// Date formatting
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Sales Analytics

export interface MonthlySalesData {
  month: number;
  monthName: string;
  totalSales: number;
  totalOrders: number;
  totalVAT: number;
  totalDiscount: number;
}

export function getMonthlySalesByYear(
  year: number,
  sources?: AnalyticsDataSources
): MonthlySalesData[] {
  const { bills } = useSources(sources);
  const billsByYear = bills.filter(
    (bill) => getYear(new Date(bill.createdAt)) === year
  );

  const monthlyData: { [key: number]: MonthlySalesData } = {};

  for (let month = 1; month <= 12; month++) {
    monthlyData[month] = {
      month,
      monthName: getMonthName(month),
      totalSales: 0,
      totalOrders: 0,
      totalVAT: 0,
      totalDiscount: 0,
    };
  }

  billsByYear.forEach((bill) => {
    const month = getMonth(new Date(bill.createdAt));
    monthlyData[month].totalSales += bill.grandTotal || 0;
    monthlyData[month].totalOrders += 1;
    monthlyData[month].totalVAT += bill.vat || 0;
    monthlyData[month].totalDiscount += bill.discount || 0;
  });

  return Object.values(monthlyData);
}

export interface CustomerSalesData {
  customerId: number;
  customerName: string;
  totalSales: number;
  totalOrders: number;
  totalVAT: number;
}

export function getCustomerSalesByYear(
  year: number,
  customerIds?: number[],
  sources?: AnalyticsDataSources
): CustomerSalesData[] {
  const { bills, customers } = useSources(sources);
  const billsByYear = bills.filter((bill) => {
    const matchesYear = getYear(new Date(bill.createdAt)) === year;
    const matchesCustomer =
      !customerIds ||
      customerIds.length === 0 ||
      (bill.customerId && customerIds.includes(bill.customerId));
    return matchesYear && matchesCustomer;
  });

  const customerData: { [key: number]: CustomerSalesData } = {};

  billsByYear.forEach((bill) => {
    if (!bill.customerId) return;

    if (!customerData[bill.customerId]) {
      const customer = customers.find((c) => c.id === bill.customerId);
      customerData[bill.customerId] = {
        customerId: bill.customerId,
        customerName: customer?.name || "Unknown",
        totalSales: 0,
        totalOrders: 0,
        totalVAT: 0,
      };
    }

    customerData[bill.customerId].totalSales += bill.grandTotal || 0;
    customerData[bill.customerId].totalOrders += 1;
    customerData[bill.customerId].totalVAT += bill.vat || 0;
  });

  return Object.values(customerData).sort(
    (a, b) => b.totalSales - a.totalSales
  );
}

export interface YearlySalesData {
  year: number;
  totalSales: number;
  totalOrders: number;
  totalVAT: number;
  averageOrderValue: number;
}

export function getYearlySales(
  year: number,
  sources?: AnalyticsDataSources
): YearlySalesData {
  const { bills, orders } = useSources(sources);
  const billsByYear = bills.filter(
    (bill) => getYear(new Date(bill.createdAt)) === year
  );
  const ordersByYear = orders.filter(
    (order) => getYear(new Date(order.createdAt)) === year
  );

  const totalSales = billsByYear.reduce(
    (sum, bill) => sum + (bill.grandTotal || 0),
    0
  );
  const totalVAT = billsByYear.reduce((sum, bill) => sum + (bill.vat || 0), 0);
  const totalOrders = ordersByYear.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return {
    year,
    totalSales,
    totalOrders,
    totalVAT,
    averageOrderValue,
  };
}

export interface OrderStatusCount {
  status: string;
  count: number;
  percentage: number;
}

export function getOrderStatusByYear(
  year: number,
  sources?: AnalyticsDataSources
): OrderStatusCount[] {
  const { orders } = useSources(sources);
  const ordersByYear = orders.filter(
    (order) => getYear(new Date(order.createdAt)) === year
  );
  const total = ordersByYear.length;

  const statusCounts: { [key: string]: number } = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  ordersByYear.forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });

  const statusLabels: { [key: string]: string } = {
    pending: "รอดำเนินการ",
    in_progress: "กำลังดำเนินการ",
    completed: "เสร็จสมบูรณ์",
    cancelled: "ยกเลิก",
  };

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: statusLabels[status] || status,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

export interface OrderWithDetails extends OrderPO {
  customerName?: string;
  billInvoiceNo?: number;
}

export function getOrdersByYear(
  year: number,
  sources?: AnalyticsDataSources
): OrderWithDetails[] {
  const { orders, customers, bills } = useSources(sources);
  const ordersByYear = orders.filter(
    (order) => getYear(new Date(order.createdAt)) === year
  );

  return ordersByYear.map((order) => {
    const customer = customers.find((c) => c.id === order.customerId);
    const bill = order.billId
      ? bills.find((b) => b.id === order.billId)
      : undefined;

    return {
      ...order,
      customerName: customer?.name,
      billInvoiceNo: bill?.invoiceNo,
    };
  });
}

export interface DailyOrderCount {
  date: Date;
  count: number;
}

export function getDailyOrdersByMonth(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): DailyOrderCount[] {
  const { orders } = useSources(sources);
  const ordersByMonth = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  const dailyCounts: { [key: string]: number } = {};

  ordersByMonth.forEach((order) => {
    const createdAt = new Date(order.createdAt);
    const dateKey = createdAt.toISOString().split("T")[0];
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  });

  return Object.entries(dailyCounts)
    .map(([date, count]) => ({
      date: new Date(date),
      count,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface MonthlyOrderCount {
  month: number;
  monthName: string;
  count: number;
}

export function getMonthlyOrdersByYear(
  year: number,
  sources?: AnalyticsDataSources
): MonthlyOrderCount[] {
  const { orders } = useSources(sources);
  const ordersByYear = orders.filter(
    (order) => getYear(new Date(order.createdAt)) === year
  );

  const monthlyCounts: { [key: number]: number } = {};

  for (let month = 1; month <= 12; month++) {
    monthlyCounts[month] = 0;
  }

  ordersByYear.forEach((order) => {
    const month = getMonth(new Date(order.createdAt));
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  return Object.entries(monthlyCounts).map(([month, count]) => ({
    month: Number.parseInt(month),
    monthName: getMonthName(Number.parseInt(month)),
    count,
  }));
}

// Income & Expense Analytics

export interface YearlyIncomeExpenseData {
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalSalary: number;
  netIncome: number;
}

export function getIncomeExpenseByYear(
  year: number,
  sources?: AnalyticsDataSources
): YearlyIncomeExpenseData {
  const { staffIncomes, expenses, staffSalaries } = useSources(sources);

  // Calculate total staff income
  const incomesByYear = staffIncomes.filter(
    (income) => getYear(new Date(income.date)) === year
  );
  const totalIncome = incomesByYear.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  // Calculate total expenses
  const expensesByYear = expenses.filter(
    (expense) => getYear(new Date(expense.expenseDate)) === year
  );
  const totalExpense = expensesByYear.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Calculate total salary (get latest salary for each staff in that year)
  const salariesByYear = staffSalaries.filter(
    (salary) => getYear(new Date(salary.effectiveDate)) === year
  );
  // Sum all salaries * 12 months
  const uniqueStaffSalaries: { [key: number]: number } = {};
  salariesByYear.forEach((salary) => {
    uniqueStaffSalaries[salary.staffId] = Math.max(
      uniqueStaffSalaries[salary.staffId] || 0,
      salary.amount
    );
  });
  const totalSalary = Object.values(uniqueStaffSalaries).reduce(
    (sum, amount) => sum + amount * 12,
    0
  );

  const netIncome = totalIncome - totalExpense - totalSalary;

  return {
    year,
    totalIncome,
    totalExpense,
    totalSalary,
    netIncome,
  };
}

export interface ExpenseByCategoryData {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  count: number;
}

export function getExpensesByCategoryAndYear(
  year: number,
  sources?: AnalyticsDataSources
): ExpenseByCategoryData[] {
  const { expenses, expenseCategories } = useSources(sources);
  const expensesByYear = expenses.filter(
    (expense) => getYear(new Date(expense.expenseDate)) === year
  );

  const categoryData: { [key: number]: ExpenseByCategoryData } = {};

  expensesByYear.forEach((expense) => {
    if (!categoryData[expense.categoryId]) {
      const category = expenseCategories.find(
        (c) => c.id === expense.categoryId
      );
      categoryData[expense.categoryId] = {
        categoryId: expense.categoryId,
        categoryName: category?.name || "Unknown",
        totalAmount: 0,
        count: 0,
      };
    }

    categoryData[expense.categoryId].totalAmount += expense.amount;
    categoryData[expense.categoryId].count += 1;
  });

  return Object.values(categoryData).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
}

export interface IncomeByTypeData {
  typeId: number;
  typeName: string;
  totalAmount: number;
  count: number;
}

export function getIncomesByTypeAndYear(
  year: number,
  sources?: AnalyticsDataSources
): IncomeByTypeData[] {
  const { staffIncomes, typeStaffIncome } = useSources(sources);
  const incomesByYear = staffIncomes.filter(
    (income) => getYear(new Date(income.date)) === year
  );

  const typeData: { [key: number]: IncomeByTypeData } = {};

  incomesByYear.forEach((income) => {
    if (!income.typeId) return;

    if (!typeData[income.typeId]) {
      const type = typeStaffIncome.find((t) => t.id === income.typeId);
      typeData[income.typeId] = {
        typeId: income.typeId,
        typeName: type?.name || "Unknown",
        totalAmount: 0,
        count: 0,
      };
    }

    typeData[income.typeId].totalAmount += income.amount;
    typeData[income.typeId].count += 1;
  });

  return Object.values(typeData).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function getRecentExpenses(
  year: number,
  limit = 10,
  sources?: AnalyticsDataSources
): Expense[] {
  const { expenses } = useSources(sources);
  const expensesByYear = expenses.filter(
    (expense) => getYear(new Date(expense.expenseDate)) === year
  );
  return expensesByYear
    .sort(
      (a, b) =>
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    )
    .slice(0, limit);
}

export function getRecentIncomes(
  year: number,
  limit = 10,
  sources?: AnalyticsDataSources
): StaffIncome[] {
  const { staffIncomes } = useSources(sources);
  const incomesByYear = staffIncomes.filter(
    (income) => getYear(new Date(income.date)) === year
  );
  return incomesByYear
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Utility to get all available years
export function getAvailableYears(sources?: AnalyticsDataSources): number[] {
  const { bills, orders, expenses, staffIncomes, staffSalaries } =
    useSources(sources);
  const years = new Set<number>();

  bills.forEach((bill) => years.add(getYear(new Date(bill.createdAt))));
  orders.forEach((order) => years.add(getYear(new Date(order.createdAt))));
  expenses.forEach((expense) =>
    years.add(getYear(new Date(expense.expenseDate)))
  );
  staffIncomes.forEach((income) => years.add(getYear(new Date(income.date))));
  staffSalaries.forEach((salary) =>
    years.add(getYear(new Date(salary.effectiveDate)))
  );

  return Array.from(years).sort((a, b) => b - a);
}

// Top Customers Analytics
export interface TopCustomerData {
  customerId: number;
  customerName: string;
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  shareOfTotal: number;
}

export function getTopCustomers(
  year: number,
  month?: number,
  sources?: AnalyticsDataSources
): TopCustomerData[] {
  const { bills, customers } = useSources(sources);
  let billsByPeriod = bills.filter(
    (bill) => getYear(new Date(bill.createdAt)) === year
  );

  if (month) {
    billsByPeriod = billsByPeriod.filter(
      (bill) => getMonth(new Date(bill.createdAt)) === month
    );
  }

  const totalSales = billsByPeriod.reduce(
    (sum, bill) => sum + (bill.grandTotal || 0),
    0
  );
  const customerData: { [key: number]: TopCustomerData } = {};

  billsByPeriod.forEach((bill) => {
    if (!bill.customerId) return;

    if (!customerData[bill.customerId]) {
      const customer = customers.find((c) => c.id === bill.customerId);
      customerData[bill.customerId] = {
        customerId: bill.customerId,
        customerName: customer?.name || "Unknown",
        totalSales: 0,
        orderCount: 0,
        avgOrderValue: 0,
        shareOfTotal: 0,
      };
    }

    customerData[bill.customerId].totalSales += bill.grandTotal || 0;
    customerData[bill.customerId].orderCount += 1;
  });

  return Object.values(customerData)
    .map((customer) => ({
      ...customer,
      avgOrderValue: customer.totalSales / customer.orderCount,
      shareOfTotal:
        totalSales > 0 ? (customer.totalSales / totalSales) * 100 : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

export interface ConcentrationMetrics {
  top1Share: number;
  top3Share: number;
  top5Share: number;
  herfindahlIndex: number;
}

export function getCustomerConcentration(
  year: number,
  month?: number,
  sources?: AnalyticsDataSources
): ConcentrationMetrics {
  const topCustomers = getTopCustomers(year, month, sources);

  const top1Share = topCustomers.length >= 1 ? topCustomers[0].shareOfTotal : 0;
  const top3Share = topCustomers
    .slice(0, 3)
    .reduce((sum, c) => sum + c.shareOfTotal, 0);
  const top5Share = topCustomers
    .slice(0, 5)
    .reduce((sum, c) => sum + c.shareOfTotal, 0);

  // Herfindahl Index (sum of squared market shares)
  const herfindahlIndex = topCustomers.reduce(
    (sum, c) => sum + Math.pow(c.shareOfTotal, 2),
    0
  );

  return {
    top1Share,
    top3Share,
    top5Share,
    herfindahlIndex,
  };
}

// Cashflow Analytics
export interface MonthlyCashflowData {
  month: number;
  monthName: string;
  inflow: number;
  outflow: number;
  netCashflow: number;
  cumulativeNet: number;
}

export function getCashflowByMonth(
  year: number,
  sources?: AnalyticsDataSources
): MonthlyCashflowData[] {
  const { staffIncomes, expenses, staffSalaries } = useSources(sources);
  const monthlyData: MonthlyCashflowData[] = [];
  let cumulativeNet = 0;

  for (let month = 1; month <= 12; month++) {
    // Calculate inflow (staff income)
    const incomes = staffIncomes.filter((income) => {
      const incomeDate = new Date(income.date);
      return getYear(incomeDate) === year && getMonth(incomeDate) === month;
    });
    const inflow = incomes.reduce((sum, income) => sum + income.amount, 0);

    // Calculate outflow (expenses + salaries for that month)
    const expensesForMonth = expenses.filter((expense) => {
      const expenseDate = new Date(expense.expenseDate);
      return getYear(expenseDate) === year && getMonth(expenseDate) === month;
    });
    const expenseTotal = expensesForMonth.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Get salaries effective in that month (monthly salary amount)
    const salaries = staffSalaries.filter((salary) => {
      const effectiveDate = new Date(salary.effectiveDate);
      return (
        getYear(effectiveDate) === year && getMonth(effectiveDate) <= month
      );
    });
    // Get latest salary for each staff
    const staffSalaryMap: { [key: number]: number } = {};
    salaries.forEach((salary) => {
      const salaryMonth = getMonth(new Date(salary.effectiveDate));
      if (salaryMonth <= month) {
        staffSalaryMap[salary.staffId] = salary.amount;
      }
    });
    const salaryTotal = Object.values(staffSalaryMap).reduce(
      (sum, amount) => sum + amount,
      0
    );

    const outflow = expenseTotal + salaryTotal;
    const netCashflow = inflow - outflow;
    cumulativeNet += netCashflow;

    monthlyData.push({
      month,
      monthName: getMonthName(month),
      inflow,
      outflow,
      netCashflow,
      cumulativeNet,
    });
  }

  return monthlyData;
}

export interface CashflowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  bestMonth: { month: number; monthName: string; amount: number };
  worstMonth: { month: number; monthName: string; amount: number };
}

export function getCashflowSummary(
  year: number,
  sources?: AnalyticsDataSources
): CashflowSummary {
  const monthlyData = getCashflowByMonth(year, sources);

  const totalInflow = monthlyData.reduce((sum, m) => sum + m.inflow, 0);
  const totalOutflow = monthlyData.reduce((sum, m) => sum + m.outflow, 0);
  const netCashflow = totalInflow - totalOutflow;

  const sortedByNet = [...monthlyData].sort(
    (a, b) => b.netCashflow - a.netCashflow
  );
  const bestMonth = sortedByNet[0] || {
    month: 0,
    monthName: "-",
    netCashflow: 0,
  };
  const worstMonth = sortedByNet[sortedByNet.length - 1] || {
    month: 0,
    monthName: "-",
    netCashflow: 0,
  };

  return {
    totalInflow,
    totalOutflow,
    netCashflow,
    bestMonth: {
      month: bestMonth.month,
      monthName: bestMonth.monthName,
      amount: bestMonth.netCashflow,
    },
    worstMonth: {
      month: worstMonth.month,
      monthName: worstMonth.monthName,
      amount: worstMonth.netCashflow,
    },
  };
}

export interface MonthCashflowDetail {
  incomes: StaffIncome[];
  expenses: Expense[];
  salaries: { staffId: number; staffName: string; amount: number }[];
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
}

export function getMonthCashflowDetail(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): MonthCashflowDetail {
  const { staffIncomes, expenses, staffSalaries, staff } = useSources(sources);

  // Get incomes
  const incomes = staffIncomes.filter((income) => {
    const incomeDate = new Date(income.date);
    return getYear(incomeDate) === year && getMonth(incomeDate) === month;
  });
  const totalInflow = incomes.reduce((sum, income) => sum + income.amount, 0);

  // Get expenses
  const expensesForMonth = expenses.filter((expense) => {
    const expenseDate = new Date(expense.expenseDate);
    return getYear(expenseDate) === year && getMonth(expenseDate) === month;
  });
  const expenseTotal = expensesForMonth.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Get salaries
  const salaries = staffSalaries.filter((salary) => {
    const effectiveDate = new Date(salary.effectiveDate);
    return getYear(effectiveDate) === year && getMonth(effectiveDate) <= month;
  });
  const staffSalaryMap: { [key: number]: number } = {};
  salaries.forEach((salary) => {
    const salaryMonth = getMonth(new Date(salary.effectiveDate));
    if (salaryMonth <= month) {
      staffSalaryMap[salary.staffId] = salary.amount;
    }
  });

  const salaryList = Object.entries(staffSalaryMap).map(([staffId, amount]) => {
    const staffMember = staff.find((s) => s.id === Number.parseInt(staffId));
    return {
      staffId: Number.parseInt(staffId),
      staffName: staffMember?.user?.name || staffMember?.position || "Unknown",
      amount,
    };
  });
  const salaryTotal = salaryList.reduce((sum, s) => sum + s.amount, 0);

  const totalOutflow = expenseTotal + salaryTotal;
  const netCashflow = totalInflow - totalOutflow;

  return {
    incomes,
    expenses: expensesForMonth,
    salaries: salaryList,
    totalInflow,
    totalOutflow,
    netCashflow,
  };
}

// Net Profit Analytics
export interface MonthlyNetProfitData {
  month: number;
  monthName: string;
  sales: number;
  expenses: number;
  salaries: number;
  netProfit: number;
  profitMargin: number;
}

export function getNetProfitByMonth(
  year: number,
  sources?: AnalyticsDataSources
): MonthlyNetProfitData[] {
  const { bills, expenses, staffSalaries } = useSources(sources);
  const monthlyData: MonthlyNetProfitData[] = [];

  for (let month = 1; month <= 12; month++) {
    // Sales from bills
    const billsForMonth = bills.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return getYear(billDate) === year && getMonth(billDate) === month;
    });
    const sales = billsForMonth.reduce(
      (sum, bill) => sum + (bill.grandTotal || 0),
      0
    );

    // Expenses
    const expensesForMonth = expenses.filter((expense) => {
      const expenseDate = new Date(expense.expenseDate);
      return getYear(expenseDate) === year && getMonth(expenseDate) === month;
    });
    const expenseTotal = expensesForMonth.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Salaries (latest for each staff up to this month)
    const salaries = staffSalaries.filter((salary) => {
      const effectiveDate = new Date(salary.effectiveDate);
      return (
        getYear(effectiveDate) === year && getMonth(effectiveDate) <= month
      );
    });
    const staffSalaryMap: { [key: number]: number } = {};
    salaries.forEach((salary) => {
      const salaryMonth = getMonth(new Date(salary.effectiveDate));
      if (salaryMonth <= month) {
        staffSalaryMap[salary.staffId] = salary.amount;
      }
    });
    const salaryTotal = Object.values(staffSalaryMap).reduce(
      (sum, amount) => sum + amount,
      0
    );

    const netProfit = sales - expenseTotal - salaryTotal;
    const profitMargin = sales > 0 ? (netProfit / sales) * 100 : 0;

    monthlyData.push({
      month,
      monthName: getMonthName(month),
      sales,
      expenses: expenseTotal,
      salaries: salaryTotal,
      netProfit,
      profitMargin,
    });
  }

  return monthlyData;
}

export interface NetProfitSummary {
  yearlyNetProfit: number;
  yearlySales: number;
  yearlyExpenses: number;
  yearlySalaries: number;
  profitMargin: number;
  momChange?: number;
  yoyChange?: number;
}

export function getNetProfitSummary(
  year: number,
  currentMonth?: number,
  sources?: AnalyticsDataSources
): NetProfitSummary {
  const monthlyData = getNetProfitByMonth(year, sources);

  const yearlySales = monthlyData.reduce((sum, m) => sum + m.sales, 0);
  const yearlyExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const yearlySalaries = monthlyData.reduce((sum, m) => sum + m.salaries, 0);
  const yearlyNetProfit = yearlySales - yearlyExpenses - yearlySalaries;
  const profitMargin =
    yearlySales > 0 ? (yearlyNetProfit / yearlySales) * 100 : 0;

  let momChange: number | undefined;
  let yoyChange: number | undefined;

  // Calculate MoM change if current month is provided
  if (currentMonth && currentMonth > 1) {
    const currentMonthData = monthlyData[currentMonth - 1];
    const prevMonthData = monthlyData[currentMonth - 2];
    if (prevMonthData.netProfit !== 0) {
      momChange =
        ((currentMonthData.netProfit - prevMonthData.netProfit) /
          Math.abs(prevMonthData.netProfit)) *
        100;
    }
  }

  // Calculate YoY change
  const prevYearData = getNetProfitByMonth(year - 1, sources);
  const prevYearProfit = prevYearData.reduce((sum, m) => sum + m.netProfit, 0);
  if (prevYearProfit !== 0) {
    yoyChange =
      ((yearlyNetProfit - prevYearProfit) / Math.abs(prevYearProfit)) * 100;
  }

  return {
    yearlyNetProfit,
    yearlySales,
    yearlyExpenses,
    yearlySalaries,
    profitMargin,
    momChange,
    yoyChange,
  };
}

export function generateProfitInsight(
  year: number,
  currentMonth?: number,
  sources?: AnalyticsDataSources
): string {
  const summary = getNetProfitSummary(year, currentMonth, sources);

  if (summary.momChange !== undefined) {
    if (summary.momChange > 0) {
      return `กำไรสุทธิเพิ่มขึ้น +${summary.momChange.toFixed(
        1
      )}% เมื่อเทียบกับเดือนที่แล้ว`;
    }
    return `กำไรสุทธิลดลง ${summary.momChange.toFixed(
      1
    )}% เมื่อเทียบกับเดือนที่แล้ว`;
  }

  if (summary.yoyChange !== undefined) {
    if (summary.yoyChange > 0) {
      return `กำไรสุทธิเพิ่มขึ้น +${summary.yoyChange.toFixed(
        1
      )}% เมื่อเทียบกับปีที่แล้ว`;
    }
    return `กำไรสุทธิลดลง ${summary.yoyChange.toFixed(
      1
    )}% เมื่อเทียบกับปีที่แล้ว`;
  }

  if (summary.profitMargin > 20) {
    return "อัตรากำไรสุทธิอยู่ในระดับดีมาก";
  }
  if (summary.profitMargin > 10) {
    return "อัตรากำไรสุทธิอยู่ในระดับดี";
  }
  if (summary.profitMargin > 0) {
    return "บริษัทมีกำไรแต่อัตรากำไรยังต่ำ";
  }
  return "บริษัทขาดทุนในปีนี้";
}

// Enhanced Monthly Orders Analytics
export interface MonthDetailOrders {
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  completedCount: number;
  pendingCount: number;
  orders: OrderWithDetails[];
}

export type OrderSortType =
  | "count-asc"
  | "count-desc"
  | "sales-asc"
  | "sales-desc"
  | "latest"
  | "oldest";

export function getOrdersForMonth(
  year: number,
  month: number,
  customerId?: number,
  sortType?: OrderSortType,
  sources?: AnalyticsDataSources
): MonthDetailOrders {
  const { orders, customers, bills } = useSources(sources);
  let ordersForMonth = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  // Filter by customer if provided
  if (customerId) {
    ordersForMonth = ordersForMonth.filter(
      (order) => order.customerId === customerId
    );
  }

  // Enrich with customer and bill data
  const enrichedOrders: OrderWithDetails[] = ordersForMonth.map((order) => {
    const customer = customers.find((c) => c.id === order.customerId);
    const bill = order.billId
      ? bills.find((b) => b.id === order.billId)
      : undefined;

    return {
      ...order,
      customerName: customer?.name,
      billInvoiceNo: bill?.invoiceNo,
    };
  });

  // Sort orders
  if (sortType) {
    enrichedOrders.sort((a, b) => {
      switch (sortType) {
        case "sales-asc":
          return a.total - b.total;
        case "sales-desc":
          return b.total - a.total;
        case "latest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });
  }

  const totalSales = enrichedOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const orderCount = enrichedOrders.length;
  const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
  const completedCount = enrichedOrders.filter(
    (o) => o.status === "completed"
  ).length;
  const pendingCount = enrichedOrders.filter(
    (o) => o.status === "pending"
  ).length;

  return {
    totalSales,
    orderCount,
    avgOrderValue,
    completedCount,
    pendingCount,
    orders: enrichedOrders,
  };
}

export interface CustomerBreakdownForMonth {
  customerId: number;
  customerName: string;
  orderCount: number;
  totalSales: number;
  avgOrder: number;
}

export function getCustomerBreakdownForMonth(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): CustomerBreakdownForMonth[] {
  const { orders, customers } = useSources(sources);
  const ordersForMonth = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  const customerData: { [key: number]: CustomerBreakdownForMonth } = {};

  ordersForMonth.forEach((order) => {
    if (!order.customerId) return;

    if (!customerData[order.customerId]) {
      const customer = customers.find((c) => c.id === order.customerId);
      customerData[order.customerId] = {
        customerId: order.customerId,
        customerName: customer?.name || "Unknown",
        orderCount: 0,
        totalSales: 0,
        avgOrder: 0,
      };
    }

    customerData[order.customerId].orderCount += 1;
    customerData[order.customerId].totalSales += order.total;
  });

  return Object.values(customerData)
    .map((customer) => ({
      ...customer,
      avgOrder:
        customer.orderCount > 0 ? customer.totalSales / customer.orderCount : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

// Month Dashboard Panel Analytics

export interface MonthSalesData {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  totalVAT: number;
  completedOrders: number;
  pendingOrders: number;
}

export function getMonthSalesData(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): MonthSalesData {
  const { bills, orders } = useSources(sources);
  const billsByMonth = bills.filter((bill) => {
    const createdAt = new Date(bill.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });
  const ordersByMonth = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  const totalSales = billsByMonth.reduce(
    (sum, bill) => sum + (bill.grandTotal || 0),
    0
  );
  const totalVAT = billsByMonth.reduce((sum, bill) => sum + (bill.vat || 0), 0);
  const totalOrders = ordersByMonth.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const completedOrders = ordersByMonth.filter(
    (o) => o.status === "completed"
  ).length;
  const pendingOrders = ordersByMonth.filter(
    (o) => o.status === "pending"
  ).length;

  return {
    totalSales,
    totalOrders,
    avgOrderValue,
    totalVAT,
    completedOrders,
    pendingOrders,
  };
}

export interface MonthCustomerData {
  customerId: number;
  customerName: string;
  orderCount: number;
  totalSales: number;
  avgOrderValue: number;
}

export function getMonthCustomerBreakdown(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): MonthCustomerData[] {
  const { bills, customers } = useSources(sources);
  const billsByMonth = bills.filter((bill) => {
    const createdAt = new Date(bill.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  const customerData: { [key: number]: MonthCustomerData } = {};

  billsByMonth.forEach((bill) => {
    if (!bill.customerId) return;

    if (!customerData[bill.customerId]) {
      const customer = customers.find((c) => c.id === bill.customerId);
      customerData[bill.customerId] = {
        customerId: bill.customerId,
        customerName: customer?.name || "Unknown",
        orderCount: 0,
        totalSales: 0,
        avgOrderValue: 0,
      };
    }

    customerData[bill.customerId].orderCount += 1;
    customerData[bill.customerId].totalSales += bill.grandTotal || 0;
  });

  return Object.values(customerData).map((customer) => ({
    ...customer,
    avgOrderValue:
      customer.orderCount > 0 ? customer.totalSales / customer.orderCount : 0,
  }));
}

export function getMonthOrders(
  year: number,
  month: number,
  sources?: AnalyticsDataSources
): OrderWithDetails[] {
  const { orders, customers, bills } = useSources(sources);
  const ordersByMonth = orders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    return getYear(createdAt) === year && getMonth(createdAt) === month;
  });

  return ordersByMonth.map((order) => {
    const customer = customers.find((c) => c.id === order.customerId);
    const bill = order.billId
      ? bills.find((b) => b.id === order.billId)
      : undefined;

    return {
      ...order,
      customerName: customer?.name,
      billInvoiceNo: bill?.invoiceNo,
    };
  });
}
