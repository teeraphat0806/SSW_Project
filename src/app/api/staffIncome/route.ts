import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { StaffIncomeSchema } from "@/lib/schemas/staffIncome.schema";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  console.log("Session:", session);

  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

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
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

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
    detail: rest.detail ?? null,
    date: new Date(),
    staffId: staffId ?? null,
    typeId: typeId ?? null,
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