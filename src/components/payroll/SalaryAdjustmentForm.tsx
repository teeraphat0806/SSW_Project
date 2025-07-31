import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee, SalaryAdjustment } from '@/types/payroll';
import { ToastContainer, toast } from 'react-toastify';

interface SalaryAdjustmentFormProps {
  employees: Employee[];
  onAdjustmentSubmit: (adjustment: Omit<SalaryAdjustment, 'id' | 'date' | 'type'>) => void;
}

export const SalaryAdjustmentForm = ({ employees, onAdjustmentSubmit }: SalaryAdjustmentFormProps) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId || !amount || !reason) {
      toast.error('Please fill in all fields', {
        position: 'bottom-right',
        });
      return;
    }

    const adjustmentAmount = parseFloat(amount);
    if (isNaN(adjustmentAmount)) {
      toast.error('Please enter a valid amount', {
        position: 'bottom-right',
        });
      return;
    }

    onAdjustmentSubmit({
      employeeId: selectedEmployeeId,
      amount: adjustmentAmount,
      reason,
    });

    // Reset form
    setSelectedEmployeeId('');
    setAmount('');
    setReason('');
    
    toast.success(`Salary ${adjustmentAmount >= 0 ? 'increased' : 'decreased'} successfully`, {
        position: 'bottom-right',
        });
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ปรับรายได้พนักงาน</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">เลือกพนักงาน</Label>
            <Select
                value={selectedEmployeeId}
                onValueChange={setSelectedEmployeeId}
            >
                <SelectTrigger className="bg-background text-muted-foreground border border-gray-300 shadow-sm">
                    <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent className="bg-background text-muted-foreground border border-gray-200 shadow-lg">
                    {employees.map((employee) => (
                        <SelectItem
                            key={employee.id}
                            value={employee.id}
                            className="bg-background text-muted-foreground hover:bg-blue-50 cursor-pointer"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{employee.name} ({employee.employeeCode})</span>
                                <span className="text-xs text-gray-500">
                                    เงินเดือนปัจจุบัน: ฿{employee.currentSalary.toLocaleString()}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {selectedEmployee && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>เงินเดือนตอนนี้:</strong> ฿{selectedEmployee.currentSalary.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                ตำแหน่ง: {selectedEmployee.position}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">ยอดเงิน</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="ใส่จำนวนเป็นบวกเพื่อเพิ่มเงินเดือน และใส่จำนวนติดลบเพื่อลดเงินเดือน"
              value={amount}
              className='bg-background border-1 border-black '
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              ใส่จำนวนเป็นบวกเพื่อเพิ่มเงินเดือน และใส่จำนวนติดลบเพื่อลดเงินเดือน
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">รายละเอียด</Label>
            <Textarea
              id="reason"
              placeholder="ใส่เหตุผลการปรับเงินเดือน เช่น การประเมินผลงาน, การเลื่อนตำแหน่ง ฯลฯ"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className='bg-background border-1 border-black '
            />
          </div>

          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 hover:cursor-pointer hover:scale-110 transition-all text-white font-bold ">
            ตกลง
          </Button>
        </form>
      </CardContent>
      <ToastContainer />
    </Card>
  );
};