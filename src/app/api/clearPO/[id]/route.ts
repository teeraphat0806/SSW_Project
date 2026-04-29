import { NextResponse, NextRequest } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const poId = Number(id);

  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const authResult = await requireAuth(["superadmin", "clerk"]);
  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const deletePO = await prisma.$transaction(async (tx) => {
      const orderPO = await tx.orderPO.findUnique({
        where: { id: poId },
        select: { id: true, billId: true, quotationId: true },
      });

      if (!orderPO) {
        return NextResponse.json(
          { error: "Order PO not found" },
          { status: 404 },
        );
      }

      await tx.orderPO.delete({ where: { id: poId } });

      const deleteDoc = [];

      if (orderPO.billId) {
        deleteDoc.push(
          tx.bill.delete({
            where: { id: orderPO.billId },
          }),
        );
      }

      if (orderPO.quotationId) {
        deleteDoc.push(
          tx.quotation.delete({
            where: { id: orderPO.quotationId },
          }),
        );
      }

      if (deleteDoc.length > 0) {
        await Promise.all(deleteDoc);
      }

      return { message: "Order PO and related records deleted successfully" };
    });
    return NextResponse.json(deletePO);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
