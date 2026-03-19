import { optional, z } from "zod";

const steelItemSchema = z.object({
  SteelId: z.number().int().positive(),
  sequence: z.number().int().positive(),
  wide: z.number().nonnegative().nullable().optional(),
  length: z.number().nonnegative(),
  thickness: z.number().nonnegative(),
  amount: z.number().int().min(1),
  detail: z.string().nullable().optional(),
  cuttingMethod: z.enum(["normal", "FB", "RM", "CNC"]),
  weight: z.number().nonnegative().nullable().optional(),
  discount: z.number().nonnegative().nullable().optional(),
  price: z.number().nonnegative(),
  surfaceT: z.string().nullable().optional(),
  toleranceT: z.string().nullable().optional(),
  surfaceW: z.string().nullable().optional(),
  toleranceW: z.string().nullable().optional(),
  surfaceL: z.string().nullable().optional(),
  toleranceL: z.string().nullable().optional(),
  isOD: z.boolean().optional(),
  isServices: z.boolean().optional(),
  isPerAmount: z.boolean().optional(),
});

export const UpDateQuotationSchema = z.object({
  credit: z.coerce.number().int().nonnegative().optional(),
  period: z.string().optional(),
  quotationNo: z.string().optional(),
  description: z.string().optional(),
  deliveryDate: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  idBill: z.number().int().positive().nullable().optional(),
  customerId: z.number().int().positive().nullable().optional(),
  customerName: z.string().optional(),
  steelItem: z.array(steelItemSchema).optional(),
});
