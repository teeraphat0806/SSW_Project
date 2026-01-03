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
            />
            <KPIStatCard
              title="รายจ่ายรวม"
              value={incomeExpenseData.totalExpense}
              format="currency"
            />
            <KPIStatCard
              title="กำไรสุทธิ"
              value={incomeExpenseData.netIncome}
              format="currency"
              subtitle={incomeExpenseData.netIncome >= 0 ? "กำไร" : "ขาดทุน"}
            />
            <KPIStatCard
              title="เงินเดือนรวม"
              value={incomeExpenseData.totalSalary}
              format="currency"
              subtitle={`หมวดรายจ่ายสูงสุด: ${largestExpenseCategory}`}
            />
          </div>

          {/* Income vs Expense Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              ภาพรวมรายได้และรายจ่าย
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">รายได้</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(incomeExpenseData.totalIncome)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-green-500 h-full rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">รายจ่าย</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(incomeExpenseData.totalExpense)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-red-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        (incomeExpenseData.totalExpense /
                          Math.max(
                            incomeExpenseData.totalIncome,
                            incomeExpenseData.totalExpense
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">เงินเดือน</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(incomeExpenseData.totalSalary)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-6">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        (incomeExpenseData.totalSalary /
                          Math.max(
                            incomeExpenseData.totalIncome,
                            incomeExpenseData.totalExpense
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
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
