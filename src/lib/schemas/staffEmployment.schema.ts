import { z } from "zod";

export const StaffEmploymentSchema = z.object({
  staffId: z.number().int().positive(),
  endDate: z.string().datetime().optional(),
});

