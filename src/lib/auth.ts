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
          user.password,
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
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User | AppUser | null;
      trigger?: string;
      session?: any;
    }) {
      // First login - store all user data in token
      if (user) {
        const u = user as AppUser;
        (token as any).id = u.id;
        (token as any).role = u.role;

        // Fetch full user data including image and staff
        const userId = typeof u.id === "string" ? parseInt(u.id) : u.id;
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
                jobPosition: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (fullUser) {
          token.name = fullUser.name;
          token.email = fullUser.email;
          token.picture = fullUser.image;
          (token as any).role = fullUser.role;
          (token as any).staff = fullUser.staff;
        }
      }

      // Update token when session is updated (e.g., after profile image upload)
      if (trigger === "update") {
        const userId = token.sub ? parseInt(token.sub) : null;
        if (userId) {
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
                  jobPosition: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });
          if (freshUser) {
            token.name = freshUser.name;
            token.email = freshUser.email;
            token.picture = freshUser.image;
            (token as any).role = freshUser.role;
            (token as any).staff = freshUser.staff;
          }
        }
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

      // Use data from token (which is stored in cookie and persists across refreshes)
      return {
        ...session,
        user: {
          ...baseUser,
          id: token.id,
          role: token.role,
          name: token.name,
          email: token.email,
          image: token.picture, // image is stored in token.picture
          staff: (token as any).staff,
        },
      };
    },
  },

  pages: {
    signIn: "/auth",
  },
};
