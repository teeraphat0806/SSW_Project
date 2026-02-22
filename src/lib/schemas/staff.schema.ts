import { z } from "zod";

export const StaffSchema = z.object({
  bankAccount: z.string(),
  bankName: z.string(),
  code: z.string(),
  taxid: z.string(),
  social_security: z.string(),
  currentSalary: z.number(),
  startDate: z.string().datetime().optional(),
  positionId: z.number().optional(),
  hireStatus: z.boolean(),
  TerminationDate: z.string().datetime().nullable().optional(),
});
