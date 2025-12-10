import { Employee, SalaryAdjustment } from "@/types/payroll";

export const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "สมชาย ใจดี",
    staffName: "สมชาย ใจดี", // ถ้าอยากให้ชื่อโชว์อีก field
    position: "นักพัฒนาระบบ",
    code: "EMP001",
    startDate: "2023-01-15",
    bankAccount: "123-456-7890",
    bankName: "กสิกรไทย",
    currentSalary: 37000,
    social_security: "1234567890123",
    // user / userId ไม่ต้องใส่ก็ได้ เพราะเป็น optional
  },
  {
    id: 2,
    name: "วิชัย ทดสอบ",
    staffName: "วิชัย ทดสอบ",
    position: "พนักงานบัญชี",
    code: "EMP002",
    startDate: "2022-08-01",
    bankAccount: "987-654-3210",
    bankName: "ไทยพาณิชย์",
    currentSalary: 32000,
    social_security: "2345678901234",
  },
  {
    id: 3,
    name: "ประยุทธ มานดี",
    staffName: "ประยุทธ มานดี",
    position: "ผู้จัดการฝ่ายขาย",
    code: "EMP003",
    startDate: "2021-03-01",
    bankAccount: "555-123-4567",
    bankName: "กรุงเทพ",
    currentSalary: 48000,
    social_security: "3456789012345",
  },
];

export const mockAdjustments: SalaryAdjustment[] = [
  {
    id: "1",
    staffId: "1",
    amount: 2000,
    detail: "Performance bonus",
    date: "2024-01-15",
    type: "increase",
  },
  {
    id: "2",
    staffId: "2",
    amount: 2000,
    detail: "Annual increment",
    date: "2024-01-10",
    type: "increase",
  },
  {
    id: "3",
    staffId: "3",
    amount: 3000,
    detail: "Promotion adjustment",
    date: "2024-01-05",
    type: "increase",
  },
  {
    id: "4",
    staffId: "4",
    amount: 1000,
    detail: "Cost of living adjustment",
    date: "2024-01-20",
    type: "increase",
  },
];
