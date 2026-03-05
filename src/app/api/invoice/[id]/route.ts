import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ApiError = {
  status: number;
  body: { error: string };
};

function createApiError(status: number, message: string): ApiError {
  return {
    status,
    body: { error: message },
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    "body" in error
  );
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(["superadmin", "accountant", "clerk"]);
  if ("response" in authResult) return authResult.response;

  const { id } = await context.params;
  const poId = Number(id);
  if (Number.isNaN(poId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const maxRetry = 3;
    //
    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      try {
        const newInvoice = await prisma.$transaction(
          async (tx) => {
            const orderPO = await tx.orderPO.findUnique({
              where: { id: poId },
              select: { codetoinvoice: true },
            });

            if (!orderPO) {
              throw createApiError(404, "ไม่พบ Order PO นี้");
            }

            const existingInvoice = await tx.invoice.findUnique({
              where: { codetoinvoice: orderPO.codetoinvoice },
            });

            if (existingInvoice) {
              throw createApiError(400, "ใบแจ้งหนี้สำหรับ Order PO นี้มีอยู่แล้ว");
            }

            const lastInvoice = await tx.invoice.findFirst({
              orderBy: { invoiceNo: "desc" },
              select: { invoiceNo: true },
            });

            const nextInvoiceNo = (lastInvoice?.invoiceNo ?? 0) + 1;

            return tx.invoice.create({
              data: {
                codetoinvoice: orderPO.codetoinvoice,
                invoiceNo: nextInvoiceNo,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return NextResponse.json(newInvoice, { status: 201 });
      } catch (error) {
        if (isApiError(error)) {
          return NextResponse.json(error.body, { status: error.status });
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2034" && attempt < maxRetry) {
            continue;
          }

          if (error.code === "P2002") {
            const target = Array.isArray(error.meta?.target)
              ? error.meta?.target.join(",")
              : String(error.meta?.target ?? "");

            if (target.includes("codetoinvoice")) {
              return NextResponse.json(
                { error: "ใบแจ้งหนี้สำหรับ Order PO นี้มีอยู่แล้ว" },
                { status: 400 },
              );
            }

            if (target.includes("invoiceNo") && attempt < maxRetry) {
              continue;
            }
          }
        }

        throw error;
      }
    }

    throw new Error("Invoice creation retry limit exceeded");
  } catch (error) {
    console.error("Error processing invoice:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดขณะประมวลผลใบแจ้งหนี้" },
      { status: 500 },
    );
  }
}
