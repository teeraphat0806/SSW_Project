"use client";

import { useMemo } from "react";
import {
  useBills,
  useOrders,
  useCustomers,
  useExpenses,
  useExpenseCategories,
  useStaffIncomes,
  useStaffSalaries,
  useStaff,
  useTypeStaffIncomes,
} from "./useSaleDashboardData";
import type { AnalyticsDataSources } from "@/lib/saleDashboard/analytics-utils";
import {
  getMonthlySalesByYear,
  getCustomerSalesByYear,
  getYearlySales,
  getOrderStatusByYear,
  getOrdersByYear,
  getMonthlyOrdersByYear,
  getIncomeExpenseByYear,
  getExpensesByCategoryAndYear,
  getIncomesByTypeAndYear,
  getRecentExpenses,
  getRecentIncomes,
  getAvailableYears,
  getTopCustomers,
  getCustomerConcentration,
  getCashflowByMonth,
  getCashflowSummary,
  getMonthCashflowDetail,
  getNetProfitByMonth,
  getNetProfitSummary,
  generateProfitInsight,
  getOrdersForMonth,
  getCustomerBreakdownForMonth,
  getMonthSalesData,
  getMonthCustomerBreakdown,
  getMonthOrders,
  type MonthlySalesData,
  type CustomerSalesData,
  type YearlySalesData,
  type OrderStatusCount,
  type OrderWithDetails,
  type MonthlyOrderCount,
  type YearlyIncomeExpenseData,
  type ExpenseByCategoryData,
  type IncomeByTypeData,
  type TopCustomerData,
  type ConcentrationMetrics,
  type MonthlyCashflowData,
  type CashflowSummary,
  type MonthCashflowDetail,
  type MonthlyNetProfitData,
  type NetProfitSummary,
  type MonthDetailOrders,
  type CustomerBreakdownForMonth,
  type MonthSalesData,
  type MonthCustomerData,
} from "@/lib/saleDashboard/analytics-utils";

export interface UseSaleAnalyticsResult {
  // Loading and error states
  loading: boolean;
  error: string | null;

  // Available years
  years: number[];

  // Data sources
  customers: any[];

  // Sales analytics
  monthlySalesByYear: (year: number) => MonthlySalesData[];
  customerSalesByYear: (
    year: number,
    customerIds?: number[]
  ) => CustomerSalesData[];
  yearlySales: (year: number) => YearlySalesData;
  orderStatusByYear: (year: number) => OrderStatusCount[];
  ordersByYear: (year: number) => OrderWithDetails[];

  // Order analytics
  monthlyOrdersByYear: (year: number) => MonthlyOrderCount[];
  ordersForMonth: (
    year: number,
    month: number,
    customerId?: number
  ) => MonthDetailOrders;
  customerBreakdownForMonth: (
    year: number,
    month: number
  ) => CustomerBreakdownForMonth[];

  // Income & expense analytics
  incomeExpenseByYear: (year: number) => YearlyIncomeExpenseData;
  expensesByCategoryAndYear: (year: number) => ExpenseByCategoryData[];
  incomesByTypeAndYear: (year: number) => IncomeByTypeData[];
  recentExpenses: (year: number, limit?: number) => any[];
  recentIncomes: (year: number, limit?: number) => any[];

  // Customer analytics
  topCustomers: (year: number, month?: number) => TopCustomerData[];
  customerConcentration: (year: number, month?: number) => ConcentrationMetrics;

  // Cashflow analytics
  cashflowByMonth: (year: number) => MonthlyCashflowData[];
  cashflowSummary: (year: number) => CashflowSummary;
  monthCashflowDetail: (year: number, month: number) => MonthCashflowDetail;

  // Net profit analytics
  netProfitByMonth: (year: number) => MonthlyNetProfitData[];
  netProfitSummary: (year: number, currentMonth?: number) => NetProfitSummary;
  profitInsight: (year: number, currentMonth?: number) => string;

  // Month dashboard
  monthSalesData: (year: number, month: number) => MonthSalesData;
  monthCustomerBreakdown: (year: number, month: number) => MonthCustomerData[];
  monthOrders: (year: number, month: number) => OrderWithDetails[];
}

/**
 * Main hook for sales analytics
 * Composes all dashboard data from useSaleDashboardData and wraps analytics helper functions
 * Automatically passes data sources to all analytics functions
 */
export function useSaleAnalytics(): UseSaleAnalyticsResult {
  const { bills, loading: billsLoading, error: billsError } = useBills();
  const { orders, loading: ordersLoading, error: ordersError } = useOrders();
  const {
    customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses();
  const {
    expenseCategories,
    loading: expenseCategoriesLoading,
    error: expenseCategoriesError,
  } = useExpenseCategories();
  const {
    staffIncomes,
    loading: staffIncomesLoading,
    error: staffIncomesError,
  } = useStaffIncomes();
  const {
    staffSalaries,
    loading: staffSalariesLoading,
    error: staffSalariesError,
  } = useStaffSalaries();
  const { staff, loading: staffLoading, error: staffError } = useStaff();
  const {
    typeStaffIncomes,
    loading: typeStaffIncomesLoading,
    error: typeStaffIncomesError,
  } = useTypeStaffIncomes();

  // Combine loading and error states
  const loading =
    billsLoading ||
    ordersLoading ||
    customersLoading ||
    expensesLoading ||
    expenseCategoriesLoading ||
    staffIncomesLoading ||
    staffSalariesLoading ||
    staffLoading ||
    typeStaffIncomesLoading;

  const error =
    billsError ||
    ordersError ||
    customersError ||
    expensesError ||
    expenseCategoriesError ||
    staffIncomesError ||
    staffSalariesError ||
    staffError ||
    typeStaffIncomesError;

  // Build analytics data sources
  const dataSources = useMemo<AnalyticsDataSources>(
    () => ({
      bills,
      orders,
      customers,
      expenses,
      expenseCategories,
      staffIncomes,
      staffSalaries,
      staff,
      typeStaffIncome: typeStaffIncomes,
    }),
    [
      bills,
      orders,
      customers,
      expenses,
      expenseCategories,
      staffIncomes,
      staffSalaries,
      staff,
      typeStaffIncomes,
    ]
  );

  // Memoize computed years (from data sources)
  const years = useMemo(() => getAvailableYears(dataSources), [dataSources]);

  // Return wrapped analytics functions
  return {
    loading,
    error,
    years,
    customers,

    // Sales analytics
    monthlySalesByYear: (year) => getMonthlySalesByYear(year, dataSources),
    customerSalesByYear: (year, customerIds) =>
      getCustomerSalesByYear(year, customerIds, dataSources),
    yearlySales: (year) => getYearlySales(year, dataSources),
    orderStatusByYear: (year) => getOrderStatusByYear(year, dataSources),
    ordersByYear: (year) => getOrdersByYear(year, dataSources),

    // Order analytics
    monthlyOrdersByYear: (year) => getMonthlyOrdersByYear(year, dataSources),
    ordersForMonth: (year, month, customerId) =>
      getOrdersForMonth(year, month, customerId, undefined, dataSources),
    customerBreakdownForMonth: (year, month) =>
      getCustomerBreakdownForMonth(year, month, dataSources),

    // Income & expense analytics
    incomeExpenseByYear: (year) => getIncomeExpenseByYear(year, dataSources),
    expensesByCategoryAndYear: (year) =>
      getExpensesByCategoryAndYear(year, dataSources),
    incomesByTypeAndYear: (year) => getIncomesByTypeAndYear(year, dataSources),
    recentExpenses: (year, limit) =>
      getRecentExpenses(year, limit, dataSources),
    recentIncomes: (year, limit) => getRecentIncomes(year, limit, dataSources),

    // Customer analytics
    topCustomers: (year, month) => getTopCustomers(year, month, dataSources),
    customerConcentration: (year, month) =>
      getCustomerConcentration(year, month, dataSources),

    // Cashflow analytics
    cashflowByMonth: (year) => getCashflowByMonth(year, dataSources),
    cashflowSummary: (year) => getCashflowSummary(year, dataSources),
    monthCashflowDetail: (year, month) =>
      getMonthCashflowDetail(year, month, dataSources),

    // Net profit analytics
    netProfitByMonth: (year) => getNetProfitByMonth(year, dataSources),
    netProfitSummary: (year, currentMonth) =>
      getNetProfitSummary(year, currentMonth, dataSources),
    profitInsight: (year, currentMonth) =>
      generateProfitInsight(year, currentMonth, dataSources),

    // Month dashboard
    monthSalesData: (year, month) =>
      getMonthSalesData(year, month, dataSources),
    monthCustomerBreakdown: (year, month) =>
      getMonthCustomerBreakdown(year, month, dataSources),
    monthOrders: (year, month) => getMonthOrders(year, month, dataSources),
  };
}
