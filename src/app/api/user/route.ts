import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany(); // ดึงข้อมูลทั้งหมด

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  if (
    !session ||
    !["superadmin", "supervisor", "clerk", "cutter", "delivery"].includes(
      session.user?.role
    )
  ) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

  try {
    const result = await prisma.staff.findMany({});

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls" + error },
      { status: 500 }
    );
  }
}
