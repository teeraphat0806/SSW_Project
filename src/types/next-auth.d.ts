import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}

declare module "next-auth" {
  export * from "next-auth/core/types";
  export { getServerSession } from "next-auth/next";
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
