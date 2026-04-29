import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  try {
    const result = await prisma.staff.findMany({
      where: {
        user: null, // 👈 ตรงนี้ได้ staff ที่ยังไม่มี user ผูกอยู่
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const payload = result.map((staff) => ({
      ...staff,
      staffName: staff.user?.name ?? null,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls " + String(error) },
      { status: 500 }
    );
  }
}
