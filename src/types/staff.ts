import { User } from "./user";
import { OrderPO } from "./orderPO";
import { Bill } from "./bill";
import { StaffIncome } from "./staffIncome";
import { StaffSalary } from "./staffSalary";
import { ExpenseCategory } from "./expenseCategory";

export interface Staff {
  id: number;
  userId?: number | null;
  user?: User | null;
  positionId?: number | null;
  jobPosition?: {
    id: number;
    name: string;
    baseSalary: number;
  } | null;
  bankAccount: string;
  bankName: string;
  startDate: string;
  code: string;
  social_security: string;
  currentSalary: number;
  updatedAt: string;

  OrderPO?: OrderPO[];
  Bill_Bill_deliveredByToStaff?: Bill[];
  Bill_Bill_salesNameToStaff?: Bill[];
  StaffIncome?: StaffIncome[];
  StaffSalary?: StaffSalary[];
  ExpenseCategory?: ExpenseCategory[];
}
