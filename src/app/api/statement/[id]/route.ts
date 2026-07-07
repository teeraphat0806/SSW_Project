import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcStatementTotalsFromItems } from "@/lib/billingCalc";

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

  const statement = await prisma.statement.findUnique({
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

  if (!statement)
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });

  const totals = calcStatementTotalsFromItems(statement.items);
  return NextResponse.json({ statement, totals });
}
