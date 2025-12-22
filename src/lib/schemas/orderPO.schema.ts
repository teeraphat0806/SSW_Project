import { z } from 'zod'

export const OrderPOSchema = z.object({
  id: z.number().optional(),
  poNumber: z.string(),
  customerId: z.number(),
  billId : z.number().optional(),
  status: z.string(),
  total: z.number(),
  vat: z.number(),
  completedAt: z.coerce.date().optional(),
})
