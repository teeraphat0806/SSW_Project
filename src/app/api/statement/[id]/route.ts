import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { calcStatementTotals } from "@/lib/billingCalc";

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

  const statement = await prisma.statement.findUnique({
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

  if (!statement)
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });

  const totals = await calcStatementTotals(id);
  return NextResponse.json({ statement, totals });
}
