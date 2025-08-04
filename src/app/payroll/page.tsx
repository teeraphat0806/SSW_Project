'use client';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalaryAdjustmentForm } from '@/components/payroll/SalaryAdjustmentForm';
import { EmployeeOverview } from '@/components/payroll/EmployeeOverview';
import { PayslipGenerator } from '@/components/payroll/PayslipGenerator';
import { mockEmployees, mockAdjustments } from '@/data/mockPayrollData';
import { Employee, SalaryAdjustment } from '@/types/payroll';

export default function Payroll (){
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>(mockAdjustments);
  const [selectedEmployeeForPayslip, setSelectedEmployeeForPayslip] = useState<Employee | null>(null);

  const handleSalaryAdjustment = (adjustment: Omit<SalaryAdjustment, 'id' | 'date' | 'type'>) => {
    const newAdjustment: SalaryAdjustment = {
      ...adjustment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: adjustment.amount >= 0 ? 'increase' : 'decrease',
    };

    // Update employee salary
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === adjustment.employeeId 
          ? { ...emp, currentSalary: emp.currentSalary + adjustment.amount }
          : emp
      )
    );

    // Add adjustment to history
    setAdjustments(prev => [newAdjustment, ...prev]);
  };

  const handleGeneratePayslip = (employee: Employee) => {
    setSelectedEmployeeForPayslip(employee);
  };

  const handleClosePayslip = () => {
    setSelectedEmployeeForPayslip(null);
  };

  if (selectedEmployeeForPayslip) {
    return (
      <PayslipGenerator 
        employee={selectedEmployeeForPayslip} 
        onClose={handleClosePayslip}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 md:ml-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ระบบ บริหารเงินเดือนพนักงาน</h1>
        <p className="text-muted-foreground">
          บริหารเงินเดือนหพนักงาน และ สร้างใบสลิปเงินเดือน
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">เงินเดือนพนักงานทั้งหมด</TabsTrigger>
          <TabsTrigger value="adjustment">ปรับเงินเดือน</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EmployeeOverview 
            employees={employees}
            onGeneratePayslip={handleGeneratePayslip}
          />
        </TabsContent>

        <TabsContent value="adjustment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalaryAdjustmentForm 
              employees={employees}
              onAdjustmentSubmit={handleSalaryAdjustment}
            />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Adjustments</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {adjustments.slice(0, 10).map((adjustment) => {
                  const employee = employees.find(emp => emp.id === adjustment.employeeId);
                  return (
                    <div key={adjustment.id} className="p-3 border rounded-lg bg-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{employee?.name}</p>
                          <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${adjustment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {adjustment.amount >= 0 ? '+' : ''}฿{adjustment.amount.toLocaleString()}
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
      </Tabs>
    </div>
  );
};