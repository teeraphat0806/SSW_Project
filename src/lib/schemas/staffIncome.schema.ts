import { z } from 'zod'

export const StaffIncomeSchema = z.object({
  Price: z.number(),
  detail: z.string().default('-'),
  name: z.string(),
  staffId: z.number(),
})
