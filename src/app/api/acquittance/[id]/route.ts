import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcAcquittanceTotals } from "@/lib/billingCalc";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  const { id } = await context.params;
  const numId = Number(id);
  if (!numId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const acquittance = await prisma.acquittance.findUnique({
    where: { id: numId },
    include: {
      Customer: true,
      items: {
        include: {
          invoice: { include: { OrderPO: { include: { bill: true } } } },
        },
      },
    },
  });

  if (!acquittance)
    return NextResponse.json(
      { error: "Acquittance not found" },
      { status: 404 },
    );

  const totals = await calcAcquittanceTotals(numId);
  return NextResponse.json({ acquittance, totals });
}
