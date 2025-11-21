import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { StaffIncomeSchema } from "../../../lib/schemas/staffIncome.schema";

export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  // Fix: Only allow if role is superadmin OR supervisor
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

    const payload = result.map(({ Staff, ...rest }) => ({
      ...rest,
      staffName: Staff?.user?.name ?? null, // <- ชื่อพนักงาน
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls" + error },
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
  const parsed = StaffIncomeSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" });
  }

  try {
    const result = await prisma.staffIncome.create({
      data: {
        ...parsed.data,
        date: new Date(),
      },
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
