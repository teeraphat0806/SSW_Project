// src/lib/permissions.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "./auth";

export const ROLES = [
  "superadmin",
  "supervisor",
  "clerk",
  "cutter",
  "delivery",
] as const;

export type Role = (typeof ROLES)[number];

type RequireAuthSuccess = {
  ok: true;
  session: Session;   // 👈 บอกไปเลยว่าเป็น Session
};

type RequireAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type RequireAuthResult = RequireAuthSuccess | RequireAuthFailure;

export async function requireAuth(
  allowedRoles?: Role[]
): Promise<RequireAuthResult> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (session.user.role ?? "") as Role;

    if (!allowedRoles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Permission Denied!!" },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    session,
  };
}
