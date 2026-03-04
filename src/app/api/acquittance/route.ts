import { requireAuth } from "@/lib/permissions";
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "accountant",
  ]);
  if ("response" in authResult) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    // ถ้าไม่ส่ง limit หรือ page ให้ส่งทั้งหมด
    const usePagination = limitParam !== null && pageParam !== null;

    let acquittanceItems;

    let total;
    if (usePagination) {
      total = await prisma.acquittance.count();
      acquittanceItems = await prisma.acquittance.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      total = await prisma.acquittance.count();
      acquittanceItems = await prisma.acquittance.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      acquittanceItems,
      total,
      page: usePagination ? page : undefined,
      limit: usePagination ? limit : undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch acquittance items" },
      { status: 500 },
    );
  }
}
