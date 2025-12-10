import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
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
    const result = await prisma.steelType.findMany({
      where: {
        codeSteel: {
          contains: name,
          mode: "insensitive",
        },
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch steel type" },
      { status: 500 }
    );
  }
}
