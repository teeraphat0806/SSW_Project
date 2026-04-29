import { z } from "zod";

export const SteelStockSchema = z.object({
  quantity: z.number().int().positive().min(1, "จำนวนต้องไม่น้อยกว่า 1"),
  width: z.number().int().positive().nullable(),
  length: z.number().int().positive(),
  thickness: z.number().int().positive(),
});
