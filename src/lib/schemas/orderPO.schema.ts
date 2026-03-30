import { z } from 'zod'

export const OrderPOSchema = z.object({
  id: z.number().optional(),
  poNumber: z.string(),
  customerId: z.number(),
  billId : z.number().optional(),
  status: z.enum(['pending', 'cutting', 'weighing', 'ready', 'shipped', 'completed']).optional(),
  total: z.number(),
  vat: z.number(),
  urlPo: z.array(z.string()).optional(),
  completedAt: z.coerce.date().optional(),
})
