// src/lib/auth.ts
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

type AppUser = {
  id: string | number;
  role?: string | null;
};

type AppToken = {
  id?: string | number;
  role?: string | null;
};

type AppSessionUser = {
  id?: string | number;
  role?: string | null;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@doe.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // ลบบรรทัดนี้ออก หรือ comment ไว้
  // adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    // ใส่ type ให้ param เองกัน implicit any
    async jwt({ token, user }: { token: JWT; user?: User | AppUser | null }) {
      if (user) {
        const u = user as AppUser;
        (token as any).id = u.id;
        (token as any).role = u.role;
      }
      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & AppToken;
    }) {
      const baseUser = (session.user || {}) as AppSessionUser;

      return {
        ...session,
        user: {
          ...baseUser,
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },

  pages: {
    signIn: "/auth",
  },
};
