import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { StaffSalarySchema } from "../../../lib/schemas/staffSalary.schema";

export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  // Fix: Only allow if role is superadmin OR supervisor
  console.log("Session:", session);
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    const raw = await prisma.staffSalary.findMany({
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
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staffSalary: " + error },
      { status: 500 }
    );
  }
}
export async function POST(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

  // เรียก API /user/filter/?name={session.user.name}
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || `${process.env.NEXTAUTH_URL}`;

  const res = await fetch(
    `${baseUrl}/api/user/filter?name=${encodeURIComponent(session.user.name!)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }

  const users = await res.json();
  const creatorId = users[0]?.id;

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
      { status: 400 }
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
      { status: 500 }
    );
  }
}
