import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "../../../../lib/prisma";
export async function GET(req: NextRequest) {
  const session = await getServerSession({ req, ...authOptions });
  // Fix: Only allow if role is superadmin OR supervisor
  console.log("Session:", session);
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }
  try {
    const result = await prisma.staff.findMany({
      where: {
        User: null,
      },
      include: { user: { select: { name: true } } },
    });

    const payload = result.map(({ user, ...rest }) => ({
      ...rest,
      staffName: user?.name ?? null, // <- ชื่อพนักงาน
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls" + error },
      { status: 500 }
    );
  }
}
