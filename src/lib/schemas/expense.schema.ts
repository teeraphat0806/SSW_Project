import { z } from "zod";
export const ExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
  categoryId: z
    .number()
    .int()
    .positive("Category ID must be a positive integer"),
  receiptUrl: z.string().nullable().optional(),
  staffId: z.number().int().positive().optional(),
});
