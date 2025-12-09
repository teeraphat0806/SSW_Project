import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  console.log("Session:", session);

  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

  try {
    const result = await prisma.staff.findMany({
      where: {
        user: null, // 👈 ตรงนี้ได้ staff ที่ยังไม่มี user ผูกอยู่
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const payload = result.map((staff) => ({
      ...staff,
      staffName: staff.user?.name ?? null,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls " + String(error) },
      { status: 500 }
    );
  }
}
