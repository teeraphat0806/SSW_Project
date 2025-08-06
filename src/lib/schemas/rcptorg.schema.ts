import { z } from 'zod';

export const RcptorgSchema = z.object({
  date: z.coerce.date(),           // แปลงจาก string เป็น Date
  numberNo: z.string().min(1),     // ไม่ควรว่าง
  customerId: z.number().int().optional().nullable(),  // nullable และ optional
  totalPrice: z.number()
});
