import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.number().optional(),
  code: z.string().nullable().optional(),
  name: z.string(),
  address: z.string(),
  tel: z.string(),
  taxNumber: z.string(),
  faxNumber: z.string(),
  email: z.email(),
});
