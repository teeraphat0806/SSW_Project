declare module "next-auth" {
  import { NextApiHandler } from "next";
  import { NextAuthOptions } from "next-auth/core/types";

  export default function NextAuth(options: NextAuthOptions): NextApiHandler;
}
