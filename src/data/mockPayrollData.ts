import { Employee, SalaryAdjustment } from '@/types/payroll';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'สมชาย ใจดี',
    position: 'นักพัฒนาระบบ',
    code: 'EMP001',
    startDate: '2023-01-15',
    bankAccount: '123-456-7890',
    bankName: 'กสิกรไทย',
    currentSalary: 37000,
  },
  {
    id: '2',
    name: 'สุดา ขยันทำ',
    position: 'นักบัญชี',
    code: 'EMP002',
    startDate: '2022-08-10',
    bankAccount: '987-654-3210',
    bankName: 'ไทยพาณิชย์',
    currentSalary: 30000,
  },
  {
    id: '3',
    name: 'ประยุทธ มานะดี',
    position: 'ผู้จัดการฝ่ายขาย',
    code: 'EMP003',
    startDate: '2021-03-01',
    bankAccount: '555-123-4567',
    bankName: 'กรุงเทพ',
    currentSalary: 48000,
  },
  {
    id: '4',
    name: 'วิไล สุนทร',
    position: 'เลขานุการ',
    code: 'EMP004',
    startDate: '2023-06-01',
    bankAccount: '777-888-9999',
    bankName: 'กรุงศรี',
    currentSalary: 23000,
  },
];

export const mockAdjustments: SalaryAdjustment[] = [
  {
    id: '1',
    staffId: '1',
    amount: 2000,
    detail: 'Performance bonus',
    date: '2024-01-15',
    type: 'increase',
  },
  {
    id: '2',
    staffId: '2',
    amount: 2000,
    detail: 'Annual increment',
    date: '2024-01-10',
    type: 'increase',
  },
  {
    id: '3',
    staffId: '3',
    amount: 3000,
    detail: 'Promotion adjustment',
    date: '2024-01-05',
    type: 'increase',
  },
  {
    id: '4',
    staffId: '4',
    amount: 1000,
    detail: 'Cost of living adjustment',
    date: '2024-01-20',
    type: 'increase',
  },
];