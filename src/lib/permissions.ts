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
  "accountant",
  "guest",
] as const;

export type Role = (typeof ROLES)[number];

type RequireAuthSuccess = {
  ok: true;
  session: Session;
  role: Role;
};

type RequireAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type RequireAuthResult = RequireAuthSuccess | RequireAuthFailure;

// helper แยก logic แปลง role ให้เป็น Role เสมอ
function normalizeRole(rawRole: string | null | undefined): Role {
  if (rawRole && ROLES.includes(rawRole as Role)) {
    return rawRole as Role;
  }
  return "guest";
}

export async function requireAuth(
  allowedRoles?: Role[],
): Promise<RequireAuthResult> {
  // 👇 บอก TS ชัด ๆ ว่าเป็น Session | null
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session || !session.user) {
    console.log("No session or user found");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 },
      ),
    };
  }
  console.log("Session user role:", session.user.role);

  const role = normalizeRole(session.user.role ?? null);

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      console.log("session role:", role);
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Permission Denied!!" },
          { status: 403 },
        ),
      };
    }
  }

  return {
    ok: true,
    session,
    role,
  };
}
