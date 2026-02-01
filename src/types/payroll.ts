export interface Employee {
  id: number;
  name: string;
  position: string;
  code: string;
  startDate: string;
  bankAccount: string;
  bankName: string;
  taxid: string;
  currentSalary: number;
  social_security: string;
  staffName: string;
  user?: {
    id: number;
    name: string;
  };
  userId?: number;
}

export interface SalaryAdjustment {
  id: string;
  name?: string;
  nameIncome?: string;
  createdAt?: string;
  effectiveDate?: string;
  staffId: string;
  amount: number;
  detail: string;
  date: string;
  type: "increase" | "decrease";
}

export interface PayslipItem {
  nameIncome: string;
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
