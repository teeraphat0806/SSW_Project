import { z } from "zod";

export const StaffIncomeSchema = z.object({
  amount: z.number(),
  detail: z.string().optional(),
  nameIncome: z.string(),
  //date: z.date(),
  staffId: z.number().optional(),
  typeId: z.number().optional(),
});

// export const StaffIncomeSchema = z.object({
//   amount: z.number(),
//   detail: z.string().default('-'),
//   nameIncome: z.string(),
//   staffId: z.number(),
// })
