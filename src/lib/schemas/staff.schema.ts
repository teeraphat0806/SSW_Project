import { z } from 'zod'

export const StaffSchema = z.object({
  name: z.string(),
  position: z.string().default('พนักงานทั่วไป'),
  bankAccount: z.string(),
  bankName: z.string(),
  code: z.string(),
  social_security: z.string(),
  currentSalary: z.number(),
})
