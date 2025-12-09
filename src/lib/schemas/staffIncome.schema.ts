import { z } from "zod";

export const StaffIncomeSchema = z.object({
  amount: z.number(),
  detail: z.string().optional(),
  nameIncome: z.string(),
  staffId: z.number().optional().nullable(), // หรือ .nullable() ตาม schema จริง
  typeId: z.number().optional().nullable(), // ถ้ามี
});

// export const StaffIncomeSchema = z.object({
//   amount: z.number(),
//   detail: z.string().default('-'),
//   nameIncome: z.string(),
//   staffId: z.number(),
// })
