// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
