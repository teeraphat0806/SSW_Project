import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Employee } from '@/types/payroll';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';

interface EmployeeOverviewProps {
  employees: Employee[];
  onGeneratePayslip: (employee: Employee) => void;
}

export const EmployeeOverview = ({ employees, onGeneratePayslip }: EmployeeOverviewProps) => {
  const totalMonthlySalary = employees.reduce((sum, emp) => sum + emp.currentSalary, 0);
  useEffect(() => {
    console.log("arm",employees);
  },[])
  return (
    <Card>
      <CardHeader>
        <CardTitle>เงินเดือนพนักงานทั้งหมด</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-blue-500">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-white">
                  ฿{totalMonthlySalary.toLocaleString()}
                </div>
                <p className="text-sm text-gray-200">ยอดเงินเดือนรวมทั้งบริษัทประจำเดือน</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-secondary">
                  {employees.length}
                </div>
                <p className="text-sm text-muted-foreground">จำนวนพนักงานทั้งหมด</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสพนักงาน</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>เงินเดือน</TableHead>
                  <TableHead>สลิปเงินเดือน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.code}</TableCell>
                    <TableCell>{employee?.name||"arm"}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>฿{employee.currentSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => onGeneratePayslip(employee)}
                        className="flex items-center gap-2 bg-green-400 text-white font-bold hover:scale-110 hover:bg-green-600 hover:cursor-pointer transition-all "
                      >
                        <FileText className="h-4 w-4" />
                        ดาวน์โหลดสลิป
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};