import { z } from 'zod'

export const ProductSchema = z.object({
  id: z.number().optional(),
  steelType: z.string(),
  wide: z.number(),
  length: z.number(),
  thickness: z.number(),
  amount: z.number(),
  actualWeight: z.number().optional().nullable(),
  calculatedWeight: z.number().optional().nullable(),
  total: z.number(),
  orderPOId: z.number(),
})
