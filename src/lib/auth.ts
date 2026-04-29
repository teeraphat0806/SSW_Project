import "server-only";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import prisma from "./prisma";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is required in production.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john@doe.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          String(credentials.password),
          user.password,
        );

        if (!isValid) return null;

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

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;

        const userId = Number.parseInt(String(user.id), 10);
        const fullUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            staff: {
              select: {
                id: true,
                code: true,
                jobPosition: { select: { id: true, name: true } },
              },
            },
          },
        });

        if (fullUser) {
          token.name = fullUser.name;
          token.email = fullUser.email;
          token.picture = fullUser.image;
          token.role = fullUser.role;
          token.staff = fullUser.staff;
        }
      }

      if (trigger === "update") {
        const userId = token.sub ? Number.parseInt(token.sub, 10) : null;
        if (userId && Number.isFinite(userId)) {
          const freshUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              staff: {
                select: {
                  id: true,
                  code: true,
                  jobPosition: { select: { id: true, name: true } },
                },
              },
            },
          });

          if (freshUser) {
            token.name = freshUser.name;
            token.email = freshUser.email;
            token.picture = freshUser.image;
            token.role = freshUser.role;
            token.staff = freshUser.staff;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub;
        session.user.role = token.role ?? null;
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.image = token.picture ?? session.user.image;
        session.user.staff = token.staff ?? null;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth",
  },
};
