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
    const statementId = Number(body.statementId);
    const invoiceId = Number(body.invoiceId);

    if (!statementId || !invoiceId) {
      return NextResponse.json(
        { error: "statementId and invoiceId are required" },
        { status: 400 },
      );
    }

    // ลบ relation (ถ้าไม่มีอยู่จะ error P2025)
    await prisma.statementInvoice.delete({
      where: { statementId_invoiceId: { statementId, invoiceId } },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "This invoice is not in that statement" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to remove invoice from statement" },
      { status: 500 },
    );
  }
}
