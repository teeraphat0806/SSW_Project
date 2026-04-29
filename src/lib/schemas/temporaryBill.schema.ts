import { z } from 'zod'

export const TemporaryBillSchema = z.object({
  id: z.number().optional(),
  orderNo: z.string(),
  order: z.string(),
  term: z.string(),
  dueDate: z.coerce.date(),
  customerId: z.number(),
  shippingLocation: z.string(),
  numberNo: z.string(),
  date: z.coerce.date(),
  no: z.string(),
  description: z.string(),
  quantity: z.number(),
  weight: z.number(),
  unitPrice: z.number(),
  amount: z.number(),
  total: z.number(),
  totalAfterDiscount: z.number(),
  vat: z.number(),
  receivedBy: z.string(),
  deliveredBy: z.string(),
})
