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
    const result = await prisma.staffSalary.findMany({
      include: {
        Staff: {
          select: {
            name: true,
            position: true,
            bankAccount: true,
            startDate: true,
            code: true,
            social_security: true,
            currentSalary: true,
          },
        },
      },
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
    process.env.NEXT_PUBLIC_BASE_URL || `${process.env.NEXTAUTH_URL}`; // ตั้งค่าใน .env
  const res = await fetch(
    `${baseUrl}/api/user/filter?name=${encodeURIComponent(session.user.name!)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // credentials: "include" // ไม่จำเป็นใน server fetch เพราะส่งจากฝั่ง server อยู่แล้ว
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }

  const users = await res.json();
  console.log("users:", users);

  // สมมติว่าคุณต้องการเอา user แรกมาใช้เป็น createdBy
  const creatorId = users[0]?.id;
  const body = await req.json();
  const dateNow = new Date();
  const requestBody = { ...body, effectiveDate: dateNow, createdBy: creatorId };

  const parsed = StaffSalarySchema.partial().safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" });
  }

  try {
    const result = await prisma.staffSalary.create({
      data: {
        ...parsed.data,
        createdBy: creatorId, // ✅ เพิ่มตรงนี้แทน
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
