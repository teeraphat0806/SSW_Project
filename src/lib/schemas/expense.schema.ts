import { z } from "zod";
export const ExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  expenseDate: z.coerce.date().optional(),
  categoryId: z
    .number()
    .int()
    .positive("Category ID must be a positive integer")
    .optional(),
  receiptURL: z.string().optional(),
});
