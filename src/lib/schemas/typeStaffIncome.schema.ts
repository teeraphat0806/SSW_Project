import { z } from "zod";

const typesEnum = z
  .enum(["increase", "decrease"])
  .refine((val) => ["increase", "decrease"].includes(val), {
    message: "types ต้องเป็น increase หรือ decrease เท่านั้น",
  });

export const TypeStaffIncomeSchema = z.object({
  id: z.number().optional(),
  amount: z.number(),
  name: z.string(),
  types: typesEnum,
  onDelete: z.boolean().optional(),
});
