// app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const name = sp.get("name") ?? undefined;
    const email = sp.get("email") ?? undefined;
    const role = sp.get("role") ?? undefined;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name, mode: "insensitive" };
    }
    if (email) {
      where.email = { contains: email, mode: "insensitive" };
    }
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: "asc" },
      take: 50, // limit default กันล้น
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: `Error fetching users: ${String(error)}` },
      { status: 500 }
    );
  }
}
