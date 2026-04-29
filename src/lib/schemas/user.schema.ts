import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
  email: z.email(),
  password: z.string(),
  image: z.string().nullable().optional(),
  role: z.enum(['superadmin', 'guest', 'clerk', 'supervisor', 'cutter', 'delivery']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})
