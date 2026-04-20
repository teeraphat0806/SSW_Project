import { ExpenseCategory } from "./expenseCategory";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: number;
  staffId?: number | null;
  receiptUrl?: string | null;
  staff?: {
    id: number;
    name: string;
  } | null;

  createdAt: string;
  updatedAt: string;

  category: ExpenseCategory;
}
