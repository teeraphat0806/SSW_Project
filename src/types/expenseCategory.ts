import { Expense } from "./expense";
import { Staff } from "./staff";

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  staffId: number;

  expenses?: Expense[];
  Staff: Staff;
}
