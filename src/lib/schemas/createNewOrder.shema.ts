import { is } from "date-fns/locale";
import { z } from "zod";

export const CreateNewOrderSchema = z.object({
  customerId: z.number().int().positive(),
  credit: z.coerce.number().int().nonnegative().optional(),
  deliveryDate: z.coerce.date(),
  deliveryOrderNo: z.string().optional(),
  salesName: z.string().optional(),

  orderPO: z.object({
    poNumber: z.string().nullable().optional(),
    customerId: z.number().int().positive().optional(),

    urlPo: z.array(z.string()).optional().default([]),
    date: z.coerce.date().optional(),
    products: z
      .array(
        z.object({
          steelType: z.string(),
          shape: z.enum(["square", "line"]),
          sequence: z.number().int().positive(),
          wide: z.number().nullable(),
          length: z.number(),
          thickness: z.number(),
          amount: z.number().int().positive(),
          detail: z.string().optional(),
          cuttingMethod: z.enum(["normal", "FB", "RM", "CNC"]).optional(),
          job: z.string().trim().nullable().optional(),
          weight: z.number().nonnegative().nullable().optional(),
          discount: z.number().nonnegative().nullable().optional(),
          price: z.number().nonnegative().optional(),

          isOD: z.boolean().optional(),
          isServices: z.boolean().optional(),
          isPerAmount: z.boolean().optional(),
        }),
      )
      .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ")
      .max(15, "สามารถเพิ่มสินค้าได้สูงสุด 15 รายการ"),
  }),
});
