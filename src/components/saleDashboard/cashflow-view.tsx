"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  getMonthName,
} from "@/lib/saleDashboard/analytics-utils";
import { KPIStatCard } from "./kpi-stat-card";
import type { ExpenseCategory } from "@/types/expenseCategory";
import { useSaleAnalytics } from "@/hooks/saleDashboard/useSaleAnalytics";

interface CashflowViewProps {
  year: number;
}

export function CashflowView({ year }: CashflowViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const {
    cashflowByMonth,
    cashflowSummary,
    monthCashflowDetail,
    loading,
    error,
  } = useSaleAnalytics();

  const monthlyCashflow = useMemo(
    () => cashflowByMonth(year),
    [year, cashflowByMonth]
  );
  const summary = useMemo(() => cashflowSummary(year), [year, cashflowSummary]);
  const monthDetail = useMemo(
    () => (selectedMonth ? monthCashflowDetail(year, selectedMonth) : null),
    [year, selectedMonth, monthCashflowDetail]
  );

  const expenseCategoryMap = useMemo(
    () =>
      new Map(
        (monthDetail?.expenses || []).map((e) => [e.categoryId, null] as const)
      ),
    [monthDetail?.expenses]
  );

  if (error && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-2">
          ไม่สามารถโหลดข้อมูลการไหลเข้าออกเงินได้
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="เงินไหลเข้ารวม"
          value={summary.totalInflow}
          format="currency"
        />
        <KPIStatCard
          title="เงินไหลออกรวม"
          value={summary.totalOutflow}
          format="currency"
        />
        <KPIStatCard
          title="กระแสเงินสดสุทธิ"
          value={summary.netCashflow}
          format="currency"
          subtitle={summary.netCashflow >= 0 ? "บวก" : "ลบ"}
        />
        <KPIStatCard
          title="เดือนที่ดีที่สุด"
          value={summary.bestMonth.amount}
          format="currency"
          subtitle={summary.bestMonth.monthName}
        />
      </div>

      {/* Monthly Cashflow Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">กระแสเงินสดรายเดือน</h3>
        {loading && (
          <p className="text-sm text-muted-foreground mb-4">
            กำลังโหลดข้อมูล...
          </p>
        )}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เดือน</TableHead>
                <TableHead className="text-right">เงินไหลเข้า</TableHead>
                <TableHead className="text-right">เงินไหลออก</TableHead>
                <TableHead className="text-right">กระแสเงินสดสุทธิ</TableHead>
                <TableHead className="text-right">สะสม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyCashflow.map((month) => (
                <TableRow
                  key={month.month}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMonth(month.month)}
                >
                  <TableCell className="font-medium">
                    {month.monthName}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(month.inflow)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(month.outflow)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        month.netCashflow >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(month.netCashflow)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        month.cumulativeNet >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {formatCurrency(month.cumulativeNet)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          คลิกที่แถวเพื่อดูรายละเอียดของเดือนนั้น
        </p>
      </Card>

      {/* Month Detail Dialog */}
      <Dialog
        open={selectedMonth !== null}
        onOpenChange={() => setSelectedMonth(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              รายละเอียดกระแสเงินสด -{" "}
              {selectedMonth ? getMonthName(selectedMonth) : ""} {year}
            </DialogTitle>
          </DialogHeader>
          {monthDetail && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    เงินไหลเข้า
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(monthDetail.totalInflow)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    เงินไหลออก
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(monthDetail.totalOutflow)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">สุทธิ</p>
                  <p
                    className={`text-xl font-bold ${
                      monthDetail.netCashflow >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(monthDetail.netCashflow)}
                  </p>
                </Card>
              </div>

              {/* Incomes */}
              <div>
                <h4 className="font-semibold mb-2">รายได้</h4>
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
                      {monthDetail.incomes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-4"
                          >
                            ไม่มีรายได้ในเดือนนี้
                          </TableCell>
                        </TableRow>
                      ) : (
                        monthDetail.incomes.map((income) => (
                          <TableRow key={income.id}>
                            <TableCell>
                              {new Date(income.date).toLocaleDateString(
                                "th-TH"
                              )}
                            </TableCell>
                            <TableCell>{income.nameIncome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {income.detail}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(income.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h4 className="font-semibold mb-2">ค่าใช้จ่าย</h4>
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
                      {monthDetail.expenses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-4"
                          >
                            ไม่มีค่าใช้จ่ายในเดือนนี้
                          </TableCell>
                        </TableRow>
                      ) : (
                        monthDetail.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              {new Date(expense.expenseDate).toLocaleDateString(
                                "th-TH"
                              )}
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {expense.category?.name || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Salaries */}
              <div>
                <h4 className="font-semibold mb-2">เงินเดือน</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>พนักงาน</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthDetail.salaries.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground py-4"
                          >
                            ไม่มีข้อมูลเงินเดือนในเดือนนี้
                          </TableCell>
                        </TableRow>
                      ) : (
                        monthDetail.salaries.map((salary) => (
                          <TableRow key={salary.staffId}>
                            <TableCell>{salary.staffName}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(salary.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
