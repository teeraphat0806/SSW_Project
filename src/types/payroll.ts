export interface Employee {
  id: string;
  name: string;
  nameEn: string;
  position: string;
  positionEn: string;
  employeeCode: string;
  startDate: string;
  bankAccount: string;
  bankName: string;
  baseSalary: number;
  currentSalary: number;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  amount: number;
  reason: string;
  date: string;
  type: 'increase' | 'decrease';
}

export interface PayslipItem {
  description: string;
  amount: number;
}

export interface Payslip {
  employee: Employee;
  month: string;
  year: string;
  dueDate: string;
  income: PayslipItem[];
  deductions: PayslipItem[];
  netIncome: number;
  accumulatedSalary: number;
  accumulatedTax: number;
  accumulatedSocialSecurity: number;
  accumulatedProvidentFund: number;
}