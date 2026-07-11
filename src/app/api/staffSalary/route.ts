import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { StaffSalarySchema } from "../../../lib/schemas/staffSalary.schema";
import { requireAuth } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  //authenticate user
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

  // Get pagination params from query
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined;

  try {
    // Count total records
    const total = await prisma.staffSalary.count();

    // Fetch with or without pagination
    const raw = await prisma.staffSalary.findMany({
      ...(limit && {
        skip: (page - 1) * limit,
        take: limit,
      }),
      orderBy: {
        effectiveDate: "desc",
      },
      include: {
        Staff: {
          select: {
            jobPosition: true,
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

    const result = raw.map((item) => {
      if (!item.Staff) return item;

      const { user, ...staffWithoutUser } = item.Staff;

      return {
        ...item,
        Staff: {
          ...staffWithoutUser,
          name: user?.name ?? null, // ⭐ แปลงเป็น field name
        },
        name: user?.name ?? null,
      };
    });

    // Return with pagination metadata if limit is specified
    if (limit) {
      return NextResponse.json(
        {
          data: result,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        { status: 200 },
      );
    }

    // Return all data without pagination
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staffSalary: " + error },
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

  // ดึงข้อมูลผู้ใช้งาน (Creator) จากฐานข้อมูลโดยตรงเพื่อแทนการทำ Loopback Fetch
  const userName = session?.user?.name ?? "";

  if (!userName) {
    return NextResponse.json(
      { error: "Missing user name for creator lookup" },
      { status: 400 },
    );
  }

  const creatorUser = await prisma.user.findFirst({
    where: {
      name: { contains: userName, mode: "insensitive" },
    },
    orderBy: { id: "asc" },
  });

  const creatorId = creatorUser?.id;

  if (!creatorId) {
    return NextResponse.json(
      { error: "Creator user not found" },
      { status: 404 },
    );
  }

  const body = await req.json();
  const dateNow = new Date();

  // เตรียม body ที่จะส่งเข้า Zod
  const requestBody = {
    ...body,
    effectiveDate: dateNow,
    createdBy: creatorId,
  };

  const parsed = StaffSalarySchema.partial().safeParse(requestBody);

  // ❗ ต้องเช็ก success ก่อนใช้ parsed.data
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid data format",
        details: parsed.error.format(),
      },
      { status: 400 },
    );
  }

  // ตอนนี้ TypeScript รู้แล้วว่า parsed.data มีแน่ ๆ
  const { staffId, ...rest } = parsed.data;

  if (!staffId) {
    return NextResponse.json({ error: "staffId is required" }, { status: 400 });
  }

  try {
    const result = await prisma.staffSalary.create({
      data: {
        // ฟิลด์ตาม schema: amount, effectiveDate, detail, createdBy
        amount: rest.amount!,
        effectiveDate: rest.effectiveDate ?? dateNow,
        detail: rest.detail,
        createdBy: creatorId,

        // ✅ ผูกกับ Staff ผ่าน relation แทนการ set staffId ตรง ๆ
        Staff: {
          connect: {
            id: staffId,
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create staffSalary: " + error },
      { status: 500 },
    );
  }
}
