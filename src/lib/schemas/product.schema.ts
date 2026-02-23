import { z } from "zod";

export const ProductSchema = z.object({
  id: z.number().optional(),
  sequence: z.number().int().positive().optional(),
  steelid: z.number(),
  wide: z.number(),
  length: z.number(),
  thickness: z.number(),
  amount: z.number(),
  actualWeight: z.number().optional().nullable(),
  total: z.number(),
  orderPOId: z.number(),
});
