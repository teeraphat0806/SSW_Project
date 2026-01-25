import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { Prisma, SteelStatus } from "@prisma/client";
import { SteelTypeSchema } from "@/lib/schemas/steeltype.shema";

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

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") ?? "").trim();
    const statusParam = (searchParams.get("status") ?? "").trim();

    // sorting
    const sortParam = (searchParams.get("sort") ?? "createdAt").trim(); // createdAt | amount | codeSteel | price
    const orderParam = (searchParams.get("order") ?? "desc").trim(); // asc | desc

    const where: Prisma.SteelTypeWhereInput = {};

    // search Steetus
    if (statusParam) {
      // validate ว่าเป็น enum จริง
      if (!Object.values(SteelStatus).includes(statusParam as SteelStatus)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 },
        );
      }
      where.status = statusParam as SteelStatus;
    }

    if (search) {
      where.codeSteel = { contains: search, mode: "insensitive" };
    }

    const allowedSort: Array<keyof Prisma.SteelTypeOrderByWithRelationInput> = [
      "createdAt",
      "amount",
      "codeSteel",
      "price",
      "updatedAt",
    ];

    const sortField = allowedSort.includes(sortParam as any)
      ? (sortParam as any)
      : "createdAt";
    const order: Prisma.SortOrder = orderParam === "asc" ? "asc" : "desc";

    const result = await prisma.steelType.findMany({
      where,
      orderBy: { [sortField]: order },
      select: {
        id: true,
        codeSteel: true,
        amount: true,
        price: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shape: true,
        density: true,
        _count: { select: { Product: true } },
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch steel type" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  const body = await req.json();
  const parsed = SteelTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.steelType.create({
      data: parsed.data,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create steel type: " + error },
      { status: 500 },
    );
  }
}
