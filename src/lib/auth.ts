// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

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

export const authOptions: NextAuthOptions = {
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

        if (
          user &&
          (await bcrypt.compare(credentials.password, user.password))
        ) {
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } else {
          throw new Error("Invalid email or password");
        }
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const u = user as AppUser;
        return {
          ...token,
          id: u.id,
          role: u.role,
        };
      }
      return token;
    },
    session: async ({ session, token }) => {
      const t = token as AppToken;
      const baseUser = (session.user || {}) as AppSessionUser;

      return {
        ...session,
        user: {
          ...baseUser,
          ...session.user,
          id: t.id,
          role: t.role,
        },
      };
    },
  },
  pages: {
    signIn: "/auth",
  },
};
