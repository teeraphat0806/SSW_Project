'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalaryAdjustmentForm } from '@/components/payroll/SalaryAdjustmentForm';
import { PayslipGenerator } from '@/components/payroll/PayslipGenerator';
import { EmployeeOverview } from '@/components/payroll/EmployeeOverview';
import { mockEmployees, mockAdjustments } from '@/data/mockPayrollData';
import { Employee, SalaryAdjustment } from '@/types/payroll';

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>(mockAdjustments);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<'all' | string>('all');
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>('all'); // 0 = January
  const [selectedYear, setSelectedYear] = useState<'all' | number>('all');
  const [adjustmentType, setAdjustmentType] = useState<'salary' | 'other'>('salary');

  const handleSalaryAdjustment = (
    adjustment: Omit<SalaryAdjustment, 'id' | 'date' | 'type'>
  ) => {
    const newAdjustment: SalaryAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjustment.amount >= 0 ? 'increase' : 'decrease',
    };

    setEmployees(prev =>
      prev.map(emp =>
        emp.id === adjustment.employeeId
          ? { ...emp, currentSalary: emp.currentSalary + adjustment.amount }
          : emp
      )
    );

    setAdjustments(prev => [newAdjustment, ...prev]);
  };

  const handleGeneratePayslip = (employee: Employee) => {
    setSelectedEmployeeForPayslip(employee);
  };

  const handleClosePayslip = () => {
    setSelectedEmployeeForPayslip(null);
  };

  const availableYears = Array.from(
    new Set(adjustments.map(adj => new Date(adj.date).getFullYear()))
  ).sort((a, b) => b - a); // เรียงจากใหม่ไปเก่า

  const filteredAdjustments = adjustments.filter(adj => {
    const employeeMatch =
      selectedEmployeeFilter === 'all' || adj.employeeId === selectedEmployeeFilter;
    const date = new Date(adj.date);
    const monthMatch = selectedMonth === 'all' || date.getMonth() === selectedMonth;
    const yearMatch = selectedYear === 'all' || date.getFullYear() === selectedYear;
    return employeeMatch && monthMatch && yearMatch;
  });

  if (selectedEmployeeForPayslip) {
    return <PayslipGenerator employee={selectedEmployeeForPayslip} onClose={handleClosePayslip} />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 md:ml-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ระบบ บริหารเงินเดือนพนักงาน</h1>
        <p className="text-muted-foreground">บริหารเงินเดือน และ รายได้อื่น ๆ พร้อมใบสลิป</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">เงินเดือนพนักงาน</TabsTrigger>
          <TabsTrigger value="adjustment">ปรับเงินเดือน/รายได้อื่น</TabsTrigger>
          <TabsTrigger value="history">ดูรายการ</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <EmployeeOverview employees={employees} onGeneratePayslip={handleGeneratePayslip} />
        </TabsContent>

        {/* Salary + Other Income Adjustment (combined) */}
        <TabsContent value="adjustment" className="space-y-6">
          <div className="space-y-4">
            <label className="block font-medium">เลือกประเภทที่ต้องการปรับ:</label>
            <select
              className="border p-2 rounded-md"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as 'salary' | 'other')}
            >
              <option value="salary">ปรับเงินเดือน</option>
              <option value="other">ปรับรายได้อื่น (เช่น OT, มาสาย)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalaryAdjustmentForm
              employees={employees}
              onAdjustmentSubmit={handleSalaryAdjustment}
              type={adjustmentType}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                รายการล่าสุด ({adjustmentType === 'salary' ? 'เงินเดือน' : 'รายได้อื่น'})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {adjustments
                  .filter((a) => {
                    const isOther = a.reason === 'OT' || a.reason === 'มาสาย';
                    return adjustmentType === 'salary' ? !isOther : isOther;
                  })
                  .slice(0, 10)
                  .map((adjustment) => {
                    const employee = employees.find((emp) => emp.id === adjustment.employeeId);
                    return (
                      <div key={adjustment.id} className="p-3 border rounded-lg bg-card">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{employee?.name}</p>
                            <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-medium ${
                                adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {adjustment.amount >= 0 ? '+' : ''}฿
                              {adjustment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(adjustment.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* History with Filters */}
        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* พนักงาน */}
            <select
              className="border p-2 rounded-md"
              value={selectedEmployeeFilter}
              onChange={e => setSelectedEmployeeFilter(e.target.value)}
            >
              <option value="all">พนักงานทั้งหมด</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>

            {/* เดือน */}
            <select
              className="border p-2 rounded-md"
              value={selectedMonth}
              onChange={e =>
                setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
            >
              <option value="all">ทุกเดือน</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                </option>
              ))}
            </select>

            {/* ปี */}
            <select
              className="border p-2 rounded-md"
              value={selectedYear}
              onChange={e =>
                setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
            >
              <option value="all">ทุกปี</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredAdjustments.map(adjustment => {
              const employee = employees.find(emp => emp.id === adjustment.employeeId);
              return (
                <div key={adjustment.id} className="p-3 border rounded-lg bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{employee?.name}</p>
                      <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {adjustment.amount >= 0 ? '+' : ''}฿
                        {adjustment.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(adjustment.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
