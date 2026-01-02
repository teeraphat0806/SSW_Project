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
      poNumber: z.string(),
      customerId: z.number().int().positive().optional(),

      vat: z.number(),
      urlPo: z.array(z.string()),
      date: z.coerce.date().optional(),
      products: z.array(
        z.object({
          steelType: z.string(),
          weight: z.number().nullable().optional(),
          wide: z.number().nullable(),
          length: z.number(),
          thickness: z.number(),
          amount: z.number(),

          detail: z.string().optional(),
        })
      ),
    })
  ),
});
