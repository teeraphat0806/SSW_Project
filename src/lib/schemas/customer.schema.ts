import { z } from "zod";

const digitsOnly = (s: string) => s.replace(/\D/g, "");

export const CustomerSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  // Optional fields:
  // - allow empty string -> null (clear)
  // - validate only when present
  tel: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const s = digitsOnly(String(v));
      return s.length ? s : null;
    },
    z
      .string()
      .length(10, "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")
      .nullable()
      .optional(),
  ),
  taxNumber: z
    .preprocess((v) => digitsOnly(String(v ?? "")), z.string())
    .refine((v) => v.length === 13, "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก"),
  faxNumber: z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const s = digitsOnly(String(v));
      return s.length ? s : null;
    },
    z
      .string()
      .min(7, "แฟกซ์ควรเป็นตัวเลข 7–13 หลัก")
      .max(13, "แฟกซ์ควรเป็นตัวเลข 7–13 หลัก")
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
});
