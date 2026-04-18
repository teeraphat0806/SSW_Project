import { z } from "zod";
import { ExpenseSchema } from "./expense.schema";
export const ExpenseCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  expenses: z.array(z.array(ExpenseSchema)).optional(),
});
