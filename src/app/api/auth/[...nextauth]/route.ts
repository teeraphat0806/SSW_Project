import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ✅ ย้าย as any เข้าไปข้างในวงเล็บ
// เพื่อบังคับให้ TypeScript ยอมรับ authOptions นี้ แม้ Type จะไม่ตรงเป๊ะๆ
const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
