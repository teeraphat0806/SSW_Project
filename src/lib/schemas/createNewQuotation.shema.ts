import { sub } from "date-fns";
import { number, string, z } from "zod";
import { digitsOnly } from "../calculateGrandTotal";

export const CreateNewQuotationSchema = z.object({
  quotationNo: z.string(),
  customerId: z.number().int().positive().optional(),
  customerName: z.string(),
  companyName: z.string().optional(),
  address: z.string(),
  tel: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const raw = String(v).trim();
      return raw.length ? raw : null; // ✅ เก็บ raw มี "-" ได้
    },
    z
      .string()
      .refine((raw) => {
        const s = digitsOnly(raw);
        return s.length >= 9 && s.length <= 13;
      }, "เบอร์โทรควรเป็นตัวเลข 9–13 หลัก")
      .nullable()
      .optional(),
  ),

  tax: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const raw = String(v).trim();
      return raw.length ? raw : null; // ถ้าเป็นสตริงว่าง "" ให้กลายเป็น null
    },
    z
      .string()
      .refine((raw) => {
        const s = digitsOnly(raw);
        return s.length === 13; // ถ้ากรอกมา ต้องมีตัวเลข 13 หลักพอดี
      }, "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
      .nullable()
      .optional(),
  ),
  fax: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const raw = String(v).trim();
      return raw.length ? raw : null;
    },
    z
      .string()
      .refine((raw) => {
        const s = digitsOnly(raw);
        return s.length >= 7 && s.length <= 13;
      }, "แฟกซ์ควรเป็นตัวเลข 7–13 หลัก")
      .nullable()
      .optional(),
  ),
  email: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const s = String(v).trim();
      return s.length ? s : null;
    },
    z.union([z.string().email("รูปแบบอีเมลไม่ถูกต้อง"), z.null()]).optional(),
  ),
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
