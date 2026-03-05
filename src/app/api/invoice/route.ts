import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import z from "zod";

const deleteSchema = z.object({
  count: z.number().int().positive(),
});

export async function GET() {
  try {
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNo: "desc" },
      select: { invoiceNo: true },
    });
    return NextResponse.json(
      { lastInvoiceNo: lastInvoice?.invoiceNo || 0 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะดึงข้อมูลใบแจ้งหนี้" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
    const authResult = await requireAuth(["superadmin", "clerk", "supervisor"]);

    if ("response" in authResult) {
      return authResult.response;
    }

  const body = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const count = parsed.data.count;
  if (count > 5) {
    return NextResponse.json(
      { error: "ลบ Invoice ได้มากสุด 5 ใบต่อครั้ง" },
      { status: 400 },
    );
  }

  try {
    const response = await prisma.$transaction(async (tx) => {
      const lastInvoices = await tx.invoice.findMany({
        orderBy: { invoiceNo: "desc" },
        take: count,
        select: {
          id: true,
          invoiceNo: true,
          statementItem: { select: { statementId: true } },
          acquittanceItem: { select: { acquittanceId: true } },
        },
      });

      if (lastInvoices.length < count) {
        return NextResponse.json(
          { error: "ไม่มีใบแจ้งหนี้ให้ลบ" },
          { status: 400 },
        );
      }

      const blocked = lastInvoices.filter(
        (invoice) => invoice.statementItem || invoice.acquittanceItem,
      );

      if (blocked.length > 0) {
        return NextResponse.json(
          {
            error:
              "ไม่สามารถลบได้ เพราะ Invoice บางใบถูกใช้งานในใบวางบิลหรือใบเสร็จรับเงินแล้ว",
            blockedInvoiceNo: blocked.map((invoice) => invoice.invoiceNo),
          },
          { status: 409 },
        );
      }
      // ลบใบแจ้งหนี้ที่ไม่ถูกใช้งาน
      const deleted = await tx.invoice.deleteMany({
        where: { id: { in: lastInvoices.map((invoice) => invoice.id) } },
      });

      return NextResponse.json(
        { message: `ลบใบแจ้งหนี้ ${deleted.count} ใบเรียบร้อยแล้ว` },
        { status: 200 },
      );
    });

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "ไม่สามารถลบได้ เพราะ Invoice ถูกใช้งานในใบวางบิลหรือใบเสร็จรับเงินแล้ว",
        },
        { status: 409 },
      );
    }

    console.error("Error deleting invoices:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะลบใบแจ้งหนี้" },
      { status: 500 },
    );
  }
}
