import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    if (!acquittanceId || !Number.isFinite(acquittanceId)) {
      return NextResponse.json(
        { error: "acquittanceId is required" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(742020)
      `);

      const acquittance = await tx.acquittance.findUnique({
        where: { id: acquittanceId },
        select: { id: true, acquittanceNo: true, customerId: true },
      });

      if (!acquittance) {
        const err = new Error("Acquittance not found");
        (err as any).code = "ACQUITTANCE_NOT_FOUND";
        throw err;
      }

      if (acquittance.acquittanceNo !== null) {
        return acquittance;
      }

      const nextNoRows = await tx.$queryRaw<{ nextNo: number }[]>(Prisma.sql`
        SELECT COALESCE(MAX("acquittanceNo"), 0)::int + 1 AS "nextNo"
        FROM "Acquittance"
        WHERE "acquittanceNo" IS NOT NULL
      `);

      const nextNo = nextNoRows[0]?.nextNo;
      if (!nextNo) {
        const err = new Error("Failed to allocate acquittance number");
        (err as any).code = "ACQUITTANCE_NUMBER_ALLOC_FAILED";
        throw err;
      }

      const updateResult = await tx.acquittance.updateMany({
        where: {
          id: acquittanceId,
          acquittanceNo: null,
        },
        data: {
          acquittanceNo: nextNo,
        },
      });

      if (updateResult.count === 0) {
        const latest = await tx.acquittance.findUnique({
          where: { id: acquittanceId },
          select: { id: true, acquittanceNo: true, customerId: true },
        });

        if (!latest) {
          const err = new Error("Acquittance not found");
          (err as any).code = "ACQUITTANCE_NOT_FOUND";
          throw err;
        }

        return latest;
      }

      return {
        id: acquittance.id,
        acquittanceNo: nextNo,
        customerId: acquittance.customerId,
      };
    });

    return NextResponse.json({ ok: true, acquittance: result });
  } catch (error: any) {
    console.error(error);

    if (error.code === "ACQUITTANCE_NOT_FOUND") {
      return NextResponse.json(
        { error: "Acquittance not found" },
        { status: 404 },
      );
    }

    if (error.code === "ACQUITTANCE_NUMBER_ALLOC_FAILED") {
      return NextResponse.json(
        { error: "Failed to allocate acquittance number" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to assign acquittance number" },
      { status: 500 },
    );
  }
}
