// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string | null;
  }

  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id?: string | number;
      role?: string | null;
      staff?: {
        id: number;
        code: string;
        jobPosition?: {
          id: number;
          name: string;
        } | null;
      } | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | number;
    role?: string | null;
  }
}

export {};
