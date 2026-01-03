import { z } from 'zod'

export const StaffSchema = z.object({
  position: z.string().default('พนักงานทั่วไป'),
  bankAccount: z.string(),
  bankName: z.string(),
  code: z.string(),
  taxid: z.string(),
  social_security: z.string(),
  currentSalary: z.number(),
})
