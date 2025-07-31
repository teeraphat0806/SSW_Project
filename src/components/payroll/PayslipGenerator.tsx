import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Employee, Payslip, PayslipItem } from '@/types/payroll';
import { format } from 'date-fns';
import { Printer, Download } from 'lucide-react';
import Logo  from '@/components/Logo'; 
interface PayslipGeneratorProps {
  employee: Employee;
  onClose: () => void;
}

export const PayslipGenerator = ({ employee, onClose }: PayslipGeneratorProps) => {
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'MMMM');
  const currentYear = format(currentDate, 'yyyy');
  const dueDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'dd/MM/yyyy');

  // Generate mock payslip data
  const generatePayslipData = (): Payslip => {
    const baseSalary = employee.currentSalary;
    const overtime = Math.floor(Math.random() * 5000);
    const bonus = Math.floor(Math.random() * 3000);
    
    const income: PayslipItem[] = [
      { description: 'เงินเดือนประจำ (Base Salary)', amount: baseSalary },
      { description: 'ค่าล่วงเวลา (Overtime)', amount: overtime },
      { description: 'โบนัส (Bonus)', amount: bonus },
    ];

    const grossIncome = income.reduce((sum, item) => sum + item.amount, 0);
    
    const socialSecurity = Math.min(grossIncome * 0.05, 750); // 5% capped at 750
    const tax = grossIncome * 0.05; // Simplified tax calculation
    const absence = Math.floor(Math.random() * 1000);
    
    const deductions: PayslipItem[] = [
      { description: 'ประกันสังคม (Social Security)', amount: socialSecurity },
      { description: 'ภาษี (Tax)', amount: tax },
      { description: 'หักขาดงาน (Absence)', amount: absence },
    ];

    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = grossIncome - totalDeductions;

    return {
      employee,
      month: currentMonth,
      year: currentYear,
      dueDate,
      income,
      deductions,
      netIncome,
      accumulatedSalary: netIncome * 12, // Mock accumulated data
      accumulatedTax: tax * 12,
      accumulatedSocialSecurity: socialSecurity * 12,
      accumulatedProvidentFund: grossIncome * 0.03 * 12,
    };
  };

  const payslip = generatePayslipData();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 hover:cursor-pointer hover:scale-110 transition-all">
          Back to Overview
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-gray-200 hover:bg-gray-300 hover:cursor-pointer hover:scale-110 transition-all">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="bg-gray-200 hover:bg-gray-300 hover:cursor-pointer hover:scale-110 transition-all">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto md:overflow-x-visible">
        <Card className="print:shadow-none print:border-none w-max md:scale-150 md:mt-50">
        <CardContent className="p-8 text-sm font-thai">
            <div className="flex justify-between items-start mb-4">
                <div className='flex items-center gap-4'>
                    <div>
                        <Logo />
                        <p className='text-xs'>S.S.W. STEEL CENTER CO LTD </p>
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold">บริษัท เอส.เอส.ดับบลิว. สตีล เซ็นเตอร์ จำกัด</p>
                        <p>888/1-2 หมู่ 9 ซอยโรจนะการ์เด้นโฮมฯ</p>
                        <p>อ.บางปะอิน จ.พระนครศรีอยุธยา 10540</p>
                        <p>โทร. 02-1816708-9 แฟกซ์ 02-1816709</p>                   
                    </div>
                </div>
                <div className='space-y-1 text-right'>
                    <h2 className="text-xl font-bold">ใบแจ้งเงินเดือน / PAY SLIP</h2>
                    <p className="text-base font-bold">เดือน {payslip.month} {payslip.year}</p>
                </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded mb-4">
                <div className="space-y-1">
                    <p><span className="font-medium">วันที่เริ่มงาน:</span> {format(new Date(employee.startDate), 'dd/MM/yy')}</p>
                    <p><span className="font-medium">รหัสพนักงาน:</span> {employee.employeeCode}</p>
                </div>
                <div className="space-y-1">
                    <p><span className="font-medium">ชื่อพนักงาน:</span> {employee.name}</p>
                    <p><span className="font-medium">ตำแหน่ง:</span> {employee.position}</p>
                    <p><span className="font-medium">เลขที่บัญชี:</span> {employee.bankAccount}</p>
                    <p><span className="font-medium">ธนาคาร:</span> {employee.bankName}</p>
                    <p><span className="font-medium">วันที่จ่าย:</span> {payslip.dueDate}</p>
                </div>
            </div>

            {/* รายได้ / รายการหัก / สุทธิ */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                {/* รายได้ */}
                <div>
                <h3 className="font-bold text-center bg-muted py-1">รายได้ (Income)</h3>
                    <div className="border rounded p-2 space-y-1">
                        {payslip.income.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span>{item.description}</span>
                            <span>฿{item.amount.toLocaleString()}</span>
                        </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>รวมรายได้</span>
                            <span>฿{payslip.income.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* รายการหัก */}
                <div>
                    <h3 className="font-bold text-center bg-muted py-1">รายการหัก (Deduction)</h3>
                    <div className="border rounded p-2 space-y-1">
                        {payslip.deductions.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span>{item.description}</span>
                            <span>฿{item.amount.toLocaleString()}</span>
                        </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>รวมรายการหัก</span>
                            <span>฿{payslip.deductions.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* รายได้สุทธิ */}
                <div >
                    <h3 className="font-bold text-center bg-muted py-1">รายได้สุทธิ (Net Income)</h3>
                    <div className="border rounded p-2 space-y-1">
                        <div className="flex justify-between h-17">
                            <span className="font-medium">เงินได้สุทธิ</span>
                            <span className="font-bold">฿{payslip.netIncome.toLocaleString()}</span>
                        </div>    
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>รวมรายสุทธิ</span>
                            <span>฿{payslip.netIncome.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ข้อมูลสะสม */}
            <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                    <p>เงินได้สะสม</p>
                    <p className="font-bold">฿{payslip.accumulatedSalary.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p>ภาษีสะสม</p>
                    <p className="font-bold">฿{payslip.accumulatedTax.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p>ประกันสังคมสะสม</p>
                    <p className="font-bold">฿{payslip.accumulatedSocialSecurity.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p>กองทุนสำรองเลี้ยงชีพ</p>
                    <p className="font-bold">-</p>
                </div>
            </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};