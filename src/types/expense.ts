import { ExpenseCategory } from "./expenseCategory";

export interface Expense {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  categoryId: number;
  receiptUrl?: string | null;

  createdAt: string;
  updatedAt: string;

  category: ExpenseCategory;
}
