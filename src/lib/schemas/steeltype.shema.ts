import { ShapeSteel, SteelStatus } from "@prisma/client";
import { de } from "date-fns/locale";
import { z } from "zod";

export const SteelTypeSchema = z.object({
  codeSteel: z.string().min(1, "กรุณาระบุรหัสเหล็ก"),
  detail: z.string().optional(),
  shape: z.enum(ShapeSteel),
  price: z.number().min(0, "กรุณาระบุราคาต่อหน่วย"),
  density: z.number().min(0, "กรุณาระบุความหนาแน่น"),
  status: z.enum(SteelStatus).optional(),
});
