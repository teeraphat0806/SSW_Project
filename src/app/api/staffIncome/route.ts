import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { StaffIncomeSchema } from "@/lib/schemas/staffIncome.schema";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  try {
    const result = await prisma.staffIncome.findMany({
      include: {
        Staff: {
          select: {
            position: true,
            bankAccount: true,
            startDate: true,
            code: true,
            social_security: true,
            currentSalary: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
    });

    const payload = result.map((income) => ({
      ...income,
      staffName: income.Staff?.user?.name ?? null,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls " + String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);

  const body = await req.json();
  const parsed = StaffIncomeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { staffId, typeId, ...rest } = parsed.data;

  const data: Prisma.StaffIncomeUncheckedCreateInput = {
    amount: rest.amount,
    nameIncome: rest.nameIncome,
    detail: rest.detail,
    date: new Date(),
    staffId: Number(staffId),
    typeId: Number(typeId),
  };

  try {
    const result = await prisma.staffIncome.create({
      data,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create staff income" },
      { status: 500 }
    );
  }
}
