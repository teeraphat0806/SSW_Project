import { Expense } from "./expense";

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;

  expenses?: Expense[];
}
