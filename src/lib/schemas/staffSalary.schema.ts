import { z } from 'zod'

export const StaffSalarySchema = z.object({
    staffId: z.number().int().positive(),
    amount: z.number().nonnegative(),
    effectiveDate: z.coerce.date().optional(),
    name: z.string(),
    detail: z.string().trim().optional(),
    createBy: z.number()
})
