import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  const session = await getServerSession({ req, ...authOptions });
  if (
    !session ||
    !["superadmin", "supervisor", "clerk"].includes(session.user?.role)
  ) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
  }

  try {
    const result = await prisma.customer.findMany({
      where: {
        name: {
          contains: params.name,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customer" + error },
      { status: 500 }
    );
  }
}
