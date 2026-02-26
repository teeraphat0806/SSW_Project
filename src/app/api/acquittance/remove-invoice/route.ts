import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const body = await req.json();
    const acquittanceId = Number(body.acquittanceId);
    const invoiceId = Number(body.invoiceId);

    if (!acquittanceId || !invoiceId) {
      return NextResponse.json(
        { error: "acquittanceId and invoiceId are required" },
        { status: 400 },
      );
    }

    await prisma.acquittanceInvoice.delete({
      where: { acquittanceId_invoiceId: { acquittanceId, invoiceId } },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "This invoice is not in that acquittance" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to remove invoice from acquittance" },
      { status: 500 },
    );
  }
}
