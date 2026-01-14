"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { KPIStatCard } from "./kpi-stat-card";
import { CashflowView } from "./cashflow-view";
import { NetProfitView } from "./net-profit-view";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/saleDashboard/analytics-utils";
import { useSaleAnalytics } from "@/hooks/saleDashboard/useSaleAnalytics";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";

// Dynamic import for chart to avoid hydration issues
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), {
  ssr: false,
});

interface IncomeExpenseDashboardProps {
  year: number;
}

export function IncomeExpenseDashboard({ year }: IncomeExpenseDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isClient, setIsClient] = useState(false);
  const {
    yearlySales,
    incomeExpenseByYear,
    expensesByCategoryAndYear,
    incomesByTypeAndYear,
    recentExpenses,
    recentIncomes,
    monthlySalesByYear,
    loading,
    error,
  } = useSaleAnalytics();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const salesData = useMemo(() => yearlySales(year), [year, yearlySales]);

  const incomeExpenseData = useMemo(
    () => incomeExpenseByYear(year),
    [year, incomeExpenseByYear]
  );
  const expensesByCategory = useMemo(
    () => expensesByCategoryAndYear(year),
    [year, expensesByCategoryAndYear]
  );
  const incomesByType = useMemo(
    () => incomesByTypeAndYear(year),
    [year, incomesByTypeAndYear]
  );
  const expensesRecent = useMemo(
    () => recentExpenses(year, 10),
    [year, recentExpenses]
  );
  const incomesRecent = useMemo(
    () => recentIncomes(year, 10),
    [year, recentIncomes]
  );
  const monthlySales = useMemo(
    () => monthlySalesByYear(year),
    [year, monthlySalesByYear]
  );

  const largestExpenseCategory =
    expensesByCategory.length > 0 ? expensesByCategory[0].categoryName : "-";

  // Prepare monthly income/expense data for all 12 months using actual sales data
  const monthlyData = useMemo(() => {
    if (!isClient) return [];

    const months = [
      { month: 1, monthName: "มกราคม" },
      { month: 2, monthName: "กุมภาพันธ์" },
      { month: 3, monthName: "มีนาคม" },
      { month: 4, monthName: "เมษายน" },
      { month: 5, monthName: "พฤษภาคม" },
      { month: 6, monthName: "มิถุนายน" },
      { month: 7, monthName: "กรกฎาคม" },
      { month: 8, monthName: "สิงหาคม" },
      { month: 9, monthName: "กันยายน" },
      { month: 10, monthName: "ตุลาคม" },
      { month: 11, monthName: "พฤศจิกายน" },
      { month: 12, monthName: "ธันวาคม" },
    ];

    return months.map((m) => {
      // Find actual sales data for this month
      const monthSalesData = monthlySales.find((s) => s.month === m.month);
      const monthlyIncomeEstimate =
        monthSalesData?.totalSales || salesData.totalSales / 12;
      const monthlyExpenseEstimate = incomeExpenseData.totalExpense / 12;
      const monthlySalaryEstimate = incomeExpenseData.totalSalary / 12;

      return {
        month: m.month,
        monthName: m.monthName,
        รายได้: monthlyIncomeEstimate,
        เงินเดือน: monthlySalaryEstimate,
        ค่าใช้จ่าย: monthlyExpenseEstimate,
      };
    });
  }, [isClient, year, monthlySales, salesData, incomeExpenseData]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="cashflow">กระแสเงินสด</TabsTrigger>
          <TabsTrigger value="profit">กำไรสุทธิ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPIStatCard
              title="ยอดขายรวม"
              value={salesData.totalSales}
              format="currency"
              variant="success"
              icon={DollarSign}
            />
            <KPIStatCard
              title="รายจ่ายรวม"
              value={incomeExpenseData.totalExpense}
              format="currency"
              variant="danger"
              icon={CreditCard}
            />
            <KPIStatCard
              title="กำไรสุทธิ"
              value={
                salesData.totalSales -
                incomeExpenseData.totalExpense -
                incomeExpenseData.totalSalary
              }
              format="currency"
              subtitle={
                salesData.totalSales -
                  incomeExpenseData.totalExpense -
                  incomeExpenseData.totalSalary >=
                0
                  ? "กำไร"
                  : "ขาดทุน"
              }
              colorCode={
                salesData.totalSales -
                  incomeExpenseData.totalExpense -
                  incomeExpenseData.totalSalary >=
                0
                  ? "profit"
                  : "loss"
              }
              variant={
                salesData.totalSales -
                  incomeExpenseData.totalExpense -
                  incomeExpenseData.totalSalary >=
                0
                  ? "success"
                  : "danger"
              }
              icon={
                salesData.totalSales -
                  incomeExpenseData.totalExpense -
                  incomeExpenseData.totalSalary >=
                0
                  ? TrendingUp
                  : TrendingDown
              }
            />
            <KPIStatCard
              title="เงินเดือนรวม"
              value={incomeExpenseData.totalSalary}
              format="currency"
              subtitle={`หมวดรายจ่ายสูงสุด: ${largestExpenseCategory}`}
              variant="info"
              icon={Wallet}
            />
          </div>

          {/* Income vs Expense Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">
              ภาพรวมรายได้และรายจ่าย
            </h3>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div
                className={`rounded-lg p-4 ${
                  salesData.totalSales -
                    incomeExpenseData.totalExpense -
                    incomeExpenseData.totalSalary >=
                  0
                    ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
                    : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    salesData.totalSales -
                      incomeExpenseData.totalExpense -
                      incomeExpenseData.totalSalary >=
                    0
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {salesData.totalSales -
                    incomeExpenseData.totalExpense -
                    incomeExpenseData.totalSalary >=
                  0
                    ? "กำไรสูง"
                    : "ขาดทุน"}
                </p>
                <p
                  className={`text-lg font-bold ${
                    salesData.totalSales -
                      incomeExpenseData.totalExpense -
                      incomeExpenseData.totalSalary >=
                    0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {salesData.totalSales -
                    incomeExpenseData.totalExpense -
                    incomeExpenseData.totalSalary >=
                  0
                    ? "+"
                    : ""}
                  {formatCurrency(
                    salesData.totalSales -
                      incomeExpenseData.totalExpense -
                      incomeExpenseData.totalSalary
                  )}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    salesData.totalSales -
                      incomeExpenseData.totalExpense -
                      incomeExpenseData.totalSalary >=
                    0
                      ? "text-green-600 dark:text-green-300"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {salesData.totalSales > 0
                    ? `${(
                        ((salesData.totalSales -
                          incomeExpenseData.totalExpense -
                          incomeExpenseData.totalSalary) /
                          salesData.totalSales) *
                        100
                      ).toFixed(1)}% ของยอดขาย`
                    : "-"}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  อัตราค่าจ้าง
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {salesData.totalSales > 0
                    ? `${(
                        (incomeExpenseData.totalSalary / salesData.totalSales) *
                        100
                      ).toFixed(1)}%`
                    : "-"}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {formatCurrency(incomeExpenseData.totalSalary)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg p-4">
                <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                  อัตราค่าใช้จ่าย
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {salesData.totalSales > 0
                    ? `${(
                        (incomeExpenseData.totalExpense /
                          salesData.totalSales) *
                        100
                      ).toFixed(1)}%`
                    : "-"}
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {formatCurrency(incomeExpenseData.totalExpense)}
                </p>
              </div>
            </div>

            {/* Stacked Comparison Bar Chart */}
            <div className="space-y-4">
              {isClient && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="monthName"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      label={{
                        value: "จำนวนเงิน",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey="รายได้"
                      fill="#22c55e"
                      name="รายได้"
                      stackId="a"
                    />
                    <Bar
                      dataKey="เงินเดือน"
                      fill="#3b82f6"
                      name="เงินเดือน"
                      stackId="b"
                    />
                    <Bar
                      dataKey="ค่าใช้จ่าย"
                      fill="#ef4444"
                      name="ค่าใช้จ่าย"
                      stackId="b"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">ไม่พบข้อมูลรายได้</p>
                </div>
              )}

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                    ยอดขาย (100%)
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(salesData.totalSales)}
                  </p>
                  {salesData.totalSales > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                      100% ของยอดขายทั้งหมด
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                    เงินเดือน
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(incomeExpenseData.totalSalary)}
                  </p>
                  {salesData.totalSales > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                      {(
                        (incomeExpenseData.totalSalary / salesData.totalSales) *
                        100
                      ).toFixed(1)}
                      % ของยอดขาย
                    </p>
                  )}
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                    ค่าใช้จ่ายอื่น
                  </p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(incomeExpenseData.totalExpense)}
                  </p>
                  {salesData.totalSales > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-300 mt-2">
                      {(
                        (incomeExpenseData.totalExpense /
                          salesData.totalSales) *
                        100
                      ).toFixed(1)}
                      % ของยอดขาย
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Expense by Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">รายจ่ายตามหมวดหมู่</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-right">จำนวนรายการ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-right">
                      เฉลี่ยต่อรายการ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesByCategory.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        ไม่พบข้อมูลรายจ่าย
                      </TableCell>
                    </TableRow>
                  ) : (
                    expensesByCategory.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell className="font-medium">
                          {category.categoryName}
                        </TableCell>
                        <TableCell className="text-right">
                          {category.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(category.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            category.totalAmount / category.count
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {expensesByCategory.length > 0 && (
                    <TableRow className="font-bold bg-muted">
                      <TableCell>รวมทั้งหมด</TableCell>
                      <TableCell className="text-right">
                        {expensesByCategory.reduce(
                          (sum, cat) => sum + cat.count,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          expensesByCategory.reduce(
                            (sum, cat) => sum + cat.totalAmount,
                            0
                          )
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Income by Type */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              รายได้พนักงานตามประเภท
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนรายการ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-right">
                      เฉลี่ยต่อรายการ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomesByType.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        ไม่พบข้อมูลรายได้
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomesByType.map((type) => (
                      <TableRow key={type.typeId}>
                        <TableCell className="font-medium">
                          {type.typeName}
                        </TableCell>
                        <TableCell className="text-right">
                          {type.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(type.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(type.totalAmount / type.count)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {incomesByType.length > 0 && (
                    <TableRow className="font-bold bg-muted">
                      <TableCell>รวมทั้งหมด</TableCell>
                      <TableCell className="text-right">
                        {incomesByType.reduce(
                          (sum, type) => sum + type.count,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          incomesByType.reduce(
                            (sum, type) => sum + type.totalAmount,
                            0
                          )
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Recent Expenses */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">รายจ่ายล่าสุด</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        ไม่พบข้อมูลรายจ่าย
                      </TableCell>
                    </TableRow>
                  ) : (
                    expensesRecent.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {new Date(expense.expenseDate).toLocaleDateString(
                            "th-TH"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {expense.description}
                        </TableCell>
                        <TableCell>{expense.category?.name || "-"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Recent Incomes */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">รายได้พนักงานล่าสุด</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-8"
                      >
                        ไม่พบข้อมูลรายได้
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomesRecent.map((income) => (
                      <TableRow key={income.id}>
                        <TableCell>
                          {new Date(income.date).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {income.nameIncome}
                        </TableCell>
                        <TableCell>{income.detail}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(income.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="mt-6">
          <CashflowView year={year} />
        </TabsContent>

        <TabsContent value="profit" className="mt-6">
          <NetProfitView year={year} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
