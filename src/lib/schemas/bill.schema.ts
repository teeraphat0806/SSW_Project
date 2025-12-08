import { z } from "zod";

export const BillSchema = z.object({
  id: z.number().optional(),
  customerId: z.number(),
  yourRef: z.string(),
  credit: z.coerce.date(),
  deliveryOrderNo: z.string().optional().nullable(),
  salesName: z.string(),
  deliveredBy: z.string().optional().nullable(),
  description: z.string(),
  unitPrice: z.number().optional().nullable(),
  discount: z.number().optional().nullable(),
  vat: z.number(),
  dateReceive: z.coerce.date().optional().nullable(),
  deliveryDate: z.coerce.date(),
});
