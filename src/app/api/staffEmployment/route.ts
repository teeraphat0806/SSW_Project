import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { StaffEmploymentSchema } from "@/lib/schemas/staffEmployment.schema";
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

  try {
    const { searchParams } = new URL(req.url);
    const staffIdParam = searchParams.get("staffId");
    const staffId = staffIdParam ? Number(staffIdParam) : undefined;

    const result = await prisma.staffEmployment.findMany({
      where: staffId ? { staffId } : undefined,
      orderBy: [{ staffId: "asc" }, { startDate: "desc" }],
      include: {
        Staff: {
          select: {
            id: true,
            code: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff employment history: " + String(error) },
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

  const body = await req.json();
  const parsed = StaffEmploymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const staff = await prisma.staff.findUnique({
    where: { id: parsed.data.staffId },
    select: { id: true, startDate: true },
  });

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  }

  try {
    const result = await prisma.staffEmployment.create({
      data: {
        staffId: parsed.data.staffId,
        startDate: staff.startDate,
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : new Date(),
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create staff employment record: " + String(error) },
      { status: 500 },
    );
  }
}

