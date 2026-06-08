import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getCurrentBuddhistYear,
  withBuddhistYearPrefix,
} from "@/lib/statementNumber";

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

    if (!statementId || !Number.isFinite(statementId)) {
      return NextResponse.json(
        { error: "statementId is required" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        SELECT pg_advisory_xact_lock(742019)
      `);

      const statement = await tx.statement.findUnique({
        where: { id: statementId },
        select: { id: true, statementNo: true, customerId: true },
      });

      if (!statement) {
        const err = new Error("Statement not found");
        (err as any).code = "STATEMENT_NOT_FOUND";
        throw err;
      }

      if (statement.statementNo !== null) {
        return statement;
      }

      const currentBuddhistYear = getCurrentBuddhistYear();
      const currentYearRows = await tx.$queryRaw<{ maxNo: number | null }[]>(
        Prisma.sql`
        SELECT MAX("statementNo")::int AS "maxNo"
        FROM "Statement"
        WHERE "statementNo" IS NOT NULL
          AND "statementNo"::text LIKE ${`${currentBuddhistYear}%`}
      `,
      );
      const legacyStatementRows = await tx.$queryRaw<
        { maxNo: number | null }[]
      >(
        Prisma.sql`
        SELECT MAX("statementNo")::int AS "maxNo"
        FROM "Statement"
        WHERE "statementNo" IS NOT NULL
          AND "statementNo"::text NOT LIKE '25__%'
      `,
      );

      const currentYearMaxNo = currentYearRows[0]?.maxNo;
      const legacyNextNo = (legacyStatementRows[0]?.maxNo ?? 0) + 1;
      const nextNo =
        currentYearMaxNo !== null && currentYearMaxNo !== undefined
          ? currentYearMaxNo + 1
          : withBuddhistYearPrefix(legacyNextNo);
      if (!nextNo) {
        const err = new Error("Failed to allocate statement number");
        (err as any).code = "STATEMENT_NUMBER_ALLOC_FAILED";
        throw err;
      }

      const updateResult = await tx.statement.updateMany({
        where: {
          id: statementId,
          statementNo: null,
        },
        data: {
          statementNo: nextNo,
        },
      });

      if (updateResult.count === 0) {
        const latest = await tx.statement.findUnique({
          where: { id: statementId },
          select: { id: true, statementNo: true, customerId: true },
        });

        if (!latest) {
          const err = new Error("Statement not found");
          (err as any).code = "STATEMENT_NOT_FOUND";
          throw err;
        }

        return latest;
      }

      return {
        id: statement.id,
        statementNo: nextNo,
        customerId: statement.customerId,
      };
    });

    return NextResponse.json({ ok: true, statement: result });
  } catch (error: any) {
    console.error(error);

    if (error.code === "STATEMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "Statement not found" },
        { status: 404 },
      );
    }

    if (error.code === "STATEMENT_NUMBER_ALLOC_FAILED") {
      return NextResponse.json(
        { error: "Failed to allocate statement number" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to assign statement number" },
      { status: 500 },
    );
  }
}
