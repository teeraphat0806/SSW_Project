import { z } from 'zod'

export const OrderPOSchema = z.object({
  id: z.number().optional(),
  poNumber: z.string(),
  customerId: z.number(),
  total: z.number(),
  vat: z.number(),
  date: z.coerce.date().optional(),
})
