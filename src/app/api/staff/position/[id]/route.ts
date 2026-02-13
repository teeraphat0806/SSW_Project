import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

const JobPositionSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อตำแหน่ง"),
  baseSalary: z.number().positive("เงินเดือนต้องมากกว่า 0"),
});

// GET - ดึงข้อมูลตำแหน่งตาม ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const position = await prisma.jobPosition.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Job position not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error("Error fetching job position:", error);
    return NextResponse.json(
      { error: "Failed to fetch job position" },
      { status: 500 },
    );
  }
}

// PATCH - แก้ไขข้อมูลตำแหน่ง
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const parsed = JobPositionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // เช็คว่าชื่อตำแหน่งซ้ำหรือไม่ (ถ้ามีการเปลี่ยนชื่อ)
    if (parsed.data.name) {
      const existing = await prisma.jobPosition.findFirst({
        where: {
          name: parsed.data.name,
          NOT: { id: Number(id) },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "ชื่อตำแหน่งนี้มีอยู่แล้ว" },
          { status: 409 },
        );
      }
    }

    const position = await prisma.jobPosition.update({
      where: { id: Number(id) },
      data: parsed.data,
    });

    return NextResponse.json(position, { status: 200 });
  } catch (error) {
    console.error("Error updating job position:", error);
    return NextResponse.json(
      { error: "Failed to update job position" },
      { status: 500 },
    );
  }
}

// DELETE - ลบตำแหน่ง
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth(["superadmin"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    // เช็คว่ามีพนักงานใช้ตำแหน่งนี้อยู่หรือไม่
    const staffCount = await prisma.staff.count({
      where: { positionId: Number(id) },
    });

    if (staffCount > 0) {
      return NextResponse.json(
        {
          error: `ไม่สามารถลบได้ เนื่องจากมีพนักงาน ${staffCount} คนใช้ตำแหน่งนี้อยู่`,
        },
        { status: 400 },
      );
    }

    await prisma.jobPosition.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "ลบตำแหน่งสำเร็จ" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting job position:", error);
    return NextResponse.json(
      { error: "Failed to delete job position" },
      { status: 500 },
    );
  }
}
