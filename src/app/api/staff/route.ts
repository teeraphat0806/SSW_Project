import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { StaffSchema } from "../../../lib/schemas/staff.schema";
import { requireAuth } from "@/lib/permissions";
// import { Staff } from "@/types/staff";

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
  const { session } = authResult;
  console.log(session);
  try {
    const result = await prisma.staff.findMany({
      include: { user: { select: { name: true } }, jobPosition: true },
    });
    const payload = result.map((staff) => ({
      ...staff,
      staffName: staff.user?.name ?? null,
      jobPositionName: staff.jobPosition?.name ?? null,
    }));
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payrolls" + error },
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

  const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
  const parsed = StaffSchema.safeParse(body); // ✅ ตรวจสอบ schema

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data format", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const jobPosition = await prisma.jobPosition.findUnique({
    where: { id: parsed.data.positionId },
  });

  if (!jobPosition) {
    return NextResponse.json(
      { error: "ไม่พบตำแหน่งงานที่ระบุ" },
      { status: 400 },
    );
  }
  const staffData = { ...parsed.data, startDate: new Date() }; //
  try {
    const result = await prisma.staff.create({
      data: staffData,
      include: {
        jobPosition: true,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 },
    );
  }
}
