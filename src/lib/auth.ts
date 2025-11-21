import type { AuthOptions } from "next-auth/core/types";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: AuthOptions = {
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
            id: user.id.toString(), // Convert to string
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // When a user signs in, attach id and role to the token.
      if (user) {
        return { ...token, id: (user as any).id, role: (user as any).role };
      }
      return token;
    },
    session: async ({ session, token }) => {
      // Expose id and role on the session.user object returned to the client
      return {
        ...session,
        user: {
          ...(session.user as any),
          id: (token as any).id,
          role: (token as any).role,
        },
      };
    },
  },
  pages: {
    signIn: "/auth",
  },
};
