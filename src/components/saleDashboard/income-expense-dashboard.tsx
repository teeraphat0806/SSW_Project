"use client";

import { useMemo, useState } from "react";
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

interface IncomeExpenseDashboardProps {
  year: number;
}

export function IncomeExpenseDashboard({ year }: IncomeExpenseDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const {
    incomeExpenseByYear,
    expensesByCategoryAndYear,
    incomesByTypeAndYear,
    recentExpenses,
    recentIncomes,
    loading,
    error,
  } = useSaleAnalytics();

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

  const largestExpenseCategory =
    expensesByCategory.length > 0 ? expensesByCategory[0].categoryName : "-";

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
              title="รายได้รวม"
              value={incomeExpenseData.totalIncome}
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
              value={incomeExpenseData.netIncome}
              format="currency"
              subtitle={incomeExpenseData.netIncome >= 0 ? "กำไร" : "ขาดทุน"}
              colorCode={incomeExpenseData.netIncome >= 0 ? "profit" : "loss"}
              variant={incomeExpenseData.netIncome >= 0 ? "success" : "danger"}
              icon={
                incomeExpenseData.netIncome >= 0 ? TrendingUp : TrendingDown
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
                  incomeExpenseData.netIncome >= 0
                    ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
                    : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
                }`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    incomeExpenseData.netIncome >= 0
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {incomeExpenseData.netIncome >= 0 ? "กำไรสูง" : "ขาดทุน"}
                </p>
                <p
                  className={`text-lg font-bold ${
                    incomeExpenseData.netIncome >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {incomeExpenseData.netIncome >= 0 ? "+" : ""}
                  {formatCurrency(incomeExpenseData.netIncome)}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    incomeExpenseData.netIncome >= 0
                      ? "text-green-600 dark:text-green-300"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {incomeExpenseData.totalIncome > 0
                    ? `${(
                        (incomeExpenseData.netIncome /
                          incomeExpenseData.totalIncome) *
                        100
                      ).toFixed(1)}% ของรายได้`
                    : "-"}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                  อัตราค่าจ้าง
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {incomeExpenseData.totalIncome > 0
                    ? `${(
                        (incomeExpenseData.totalSalary /
                          incomeExpenseData.totalIncome) *
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
                  {incomeExpenseData.totalIncome > 0
                    ? `${(
                        (incomeExpenseData.totalExpense /
                          incomeExpenseData.totalIncome) *
                        100
                      ).toFixed(1)}%`
                    : "-"}
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {formatCurrency(incomeExpenseData.totalExpense)}
                </p>
              </div>
            </div>

            {/* Stacked Comparison Bar */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">รายได้ (100%)</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(incomeExpenseData.totalIncome)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-green-500 h-full flex items-center justify-end pr-3 text-white text-xs font-bold"
                    style={{ width: "100%" }}
                  >
                    100%
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">
                    ค่าใช้จ่ายรวม (เงินเดือน + ค่าอื่น)
                  </span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(
                      incomeExpenseData.totalSalary +
                        incomeExpenseData.totalExpense
                    )}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                  {incomeExpenseData.totalIncome > 0 ? (
                    <div className="flex h-full">
                      <div
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          width: `${Math.min(
                            (incomeExpenseData.totalSalary /
                              incomeExpenseData.totalIncome) *
                              100,
                            100
                          )}%`,
                        }}
                        title={`เงินเดือน: ${(
                          (incomeExpenseData.totalSalary /
                            incomeExpenseData.totalIncome) *
                          100
                        ).toFixed(1)}%`}
                      >
                        {Math.round(
                          (incomeExpenseData.totalSalary /
                            incomeExpenseData.totalIncome) *
                            100
                        ) > 5 &&
                          `${Math.round(
                            (incomeExpenseData.totalSalary /
                              incomeExpenseData.totalIncome) *
                              100
                          )}%`}
                      </div>
                      <div
                        className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          width: `${Math.min(
                            (incomeExpenseData.totalExpense /
                              incomeExpenseData.totalIncome) *
                              100,
                            100
                          )}%`,
                        }}
                        title={`ค่าใช้จ่าย: ${(
                          (incomeExpenseData.totalExpense /
                            incomeExpenseData.totalIncome) *
                          100
                        ).toFixed(1)}%`}
                      >
                        {Math.round(
                          (incomeExpenseData.totalExpense /
                            incomeExpenseData.totalIncome) *
                            100
                        ) > 5 &&
                          `${Math.round(
                            (incomeExpenseData.totalExpense /
                              incomeExpenseData.totalIncome) *
                              100
                          )}%`}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-gray-300" />
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>
                      เงินเดือน: {formatCurrency(incomeExpenseData.totalSalary)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>
                      ค่าใช้จ่าย:{" "}
                      {formatCurrency(incomeExpenseData.totalExpense)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">กำไรสุทธิ</span>
                  <span
                    className={`text-sm font-semibold ${
                      incomeExpenseData.netIncome >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {incomeExpenseData.netIncome >= 0 ? "+" : ""}
                    {formatCurrency(incomeExpenseData.netIncome)}
                  </span>
                </div>
                {incomeExpenseData.totalIncome > 0 ? (
                  <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-end pr-3 text-white text-xs font-bold ${
                        incomeExpenseData.netIncome >= 0
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.abs(
                            (incomeExpenseData.netIncome /
                              incomeExpenseData.totalIncome) *
                              100
                          ),
                          100
                        )}%`,
                      }}
                    >
                      {Math.abs(
                        (incomeExpenseData.netIncome /
                          incomeExpenseData.totalIncome) *
                          100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-muted rounded-full h-8" />
                )}
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
            <h3 className="text-lg font-semibold mb-4">รายได้ตามประเภท</h3>
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
            <h3 className="text-lg font-semibold mb-4">รายได้ล่าสุด</h3>
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
