import { z } from "zod";

export const CreateNewOrderSchema = z.object({
  customerId: z.number().int().positive(),
  yourRef: z.string(),
  credit: z.coerce.date().optional(),
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
          wide: z.number().nullable(),
          length: z.number(),
          thickness: z.number(),
          amount: z.number().int().positive(),
          cuttingMethod: z
            .enum(["normal", "FB", "steelDisc", "CNC"])
            .optional(),
          job: z.number().int().nullable().optional(),
          detail: z.string().optional(),
        }),
      )
      .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ")
      .max(15, "สามารถเพิ่มสินค้าได้สูงสุด 15 รายการ"),
  }),
});
