import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcAcquittanceTotals } from "@/lib/billingCalc";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const acquittance = await prisma.acquittance.findUnique({
    where: { id },
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

  const totals = await calcAcquittanceTotals(id);
  return NextResponse.json({ acquittance, totals });
}
