import { sub } from "date-fns";
import { number, string, z } from "zod";

export const CreateNewQuotationSchema = z.object({
  quotationNo: z.string(),
  customerId: z.number().int().positive().optional(),
  customerName: z.string(),
  companyName: z.string(),
  address: z.string(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  credit: z.coerce.number().int().nonnegative().optional(),
  salesName: z.string(),
  salesNameId: z.number().int().positive(),
  description: z.string().optional(),
  vatRate: z.number().nonnegative().optional(),
  //   vat: z.number().nonnegative().optional(),
  //   subTotal: z.number().nonnegative().optional(),
  //   grandTotal: z.number().nonnegative().optional(),
  period: z.string(),
  deliveryDate: z.string(),
  createdAt: z.coerce.date().optional(),

  orderPO: z.object({
    customerId: z.number().int().positive().optional(),
    products: z
      .array(
        z.object({
          SteelId: z.number().int().positive(),
          steelType: z.string(),
          shape: z.enum(["square", "line"]),
          sequence: z.number().int().positive(),
          wide: z.number().nullable(),
          length: z.number(),
          thickness: z.number(),
          amount: z.number().int().positive(),
          detail: z.string().optional(),
          cuttingMethod: z.enum(["normal", "FB", "RM", "CNC"]).optional(),
          weight: z.number().nonnegative().nullable().optional(),
          discount: z.number().nonnegative().nullable().optional(),
          price: z.number().nonnegative(),
          surfaceT: string().optional(),
          toleranceT: string().optional(),
          surfaceW: string().optional(),
          toleranceW: string().optional(),
          surfaceL: string().optional(),
          toleranceL: string().optional(),
          isOD: z.boolean().optional(),
          isServices: z.boolean().optional(),
          isPerAmount: z.boolean().optional(),
        }),
      )
      .min(1, "ต้องมีสินค้าอย่างน้อย 1 รายการ")
      .max(15, "สามารถเพิ่มสินค้าได้สูงสุด 15 รายการ"),
  }),
});
