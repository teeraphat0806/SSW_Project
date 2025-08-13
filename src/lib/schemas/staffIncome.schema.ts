import { z } from 'zod'

export const StaffIncomeSchema = z.object({
  amount: z.number(),
  detail: z.string().default('-'),
  name: z.string(),
  staffId: z.number(),
})
