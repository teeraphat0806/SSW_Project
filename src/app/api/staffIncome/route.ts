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
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");
    const staffIdParam = searchParams.get("staffId");

    // Parse pagination parameters
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const staffId = staffIdParam ? parseInt(staffIdParam, 10) : undefined;

    // Build where clause for filtering
    const where: Prisma.StaffIncomeWhereInput = {};
    if (staffId) {
      where.staffId = staffId;
    }

    // Count total records for pagination
    const total = await prisma.staffIncome.count({ where });

    // Build query with pagination if limit is specified
    const queryOptions: any = {
      where,
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
      orderBy: [{ staffId: "asc" as const }, { date: "desc" as const }],
    };

    // Add pagination if limit is specified
    if (limit) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const result = await prisma.staffIncome.findMany(queryOptions);

    const payload = result.map((income: any) => ({
      ...income,
      staffName: income.Staff?.user?.name ?? null,
    }));

    // Return with pagination metadata
    return NextResponse.json(
      {
        data: payload,
        pagination: {
          total,
          page,
          limit: limit || total,
          totalPages: limit ? Math.ceil(total / limit) : 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff income " + String(error) },
      { status: 500 },
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
      { status: 400 },
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
      { status: 500 },
    );
  }
}
