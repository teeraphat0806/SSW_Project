import { z } from "zod";
import { digitsOnly } from "@/lib/calculateGrandTotal";
import { ContactType } from "@prisma/client";

// --- Contact Schema ---
const ContactSchema = z.object({
  id: z.number().optional().nullable(), // null = create ใหม่, มีค่า = update
  type: z.nativeEnum(ContactType),
  value: z.string().trim().min(1, "กรุณากรอกข้อมูล"),
  label: z.string().trim().nullable().optional(),
  isPrimary: z.boolean().default(false),
});

export const CustomerSchema = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  credit: z.number().min(0).optional(),
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

  taxNumber: z.preprocess(
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
        return s.length === 13;
      }, "เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
      .nullable()
      .optional(),
  ),
  faxNumber: z.preprocess(
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

  contacts: z.array(ContactSchema).optional(),
  deletedContactIds: z.array(z.number()).optional(),
});
