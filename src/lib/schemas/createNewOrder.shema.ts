import { z } from "zod";

export const CreateNewOrderSchema = z.object({
  customerId: z.number().int().positive(),
  yourRef: z.string(),
  credit: z.coerce.date().optional(),
  deliveryDate: z.coerce.date(),
  deliveryOrderNo: z.string().optional(),
  salesName: z.string().optional(),
  vat: z.number(),
  orderPOs: z.array(
    z.object({
      poNumber: z.string().nullable().optional(),
      customerId: z.number().int().positive().optional(),
      vat: z.number(),
      urlPo: z.array(z.string()).optional(),
      date: z.coerce.date().optional(),
      products: z.array(
        z.object({
          steelType: z.string(),
          wide: z.number().nullable(),
          length: z.number(),
          thickness: z.number(),
          amount: z.number().int().positive(),
          cuttingMethod: z.enum(["normal", "FB", "steelDisc"]).optional(),
          job: z.int().nullable().optional(),
          detail: z.string().optional(),
        })
      ),
    })
  ),
});
