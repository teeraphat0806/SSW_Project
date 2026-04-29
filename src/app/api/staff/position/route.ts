import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

const JobPositionSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อตำแหน่ง"),
  baseSalary: z.number().positive("เงินเดือนต้องมากกว่า 0"),
});

// GET - ดึงรายการตำแหน่งทั้งหมด
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(["superadmin", "supervisor", "clerk"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const positions = await prisma.jobPosition.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { staff: true }, // นับจำนวนพนักงานในตำแหน่งนี้
        },
      },
    });

    return NextResponse.json(positions, { status: 200 });
  } catch (error) {
    console.error("Error fetching job positions:", error);
    return NextResponse.json(
      { error: "Failed to fetch job positions" },
      { status: 500 },
    );
  }
}

// POST - สร้างตำแหน่งใหม่
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(["superadmin"]);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    const body = await req.json();
    const parsed = JobPositionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data format", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // เช็คว่าชื่อตำแหน่งซ้ำหรือไม่
    const existing = await prisma.jobPosition.findUnique({
      where: { name: parsed.data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "ชื่อตำแหน่งนี้มีอยู่แล้ว" },
        { status: 409 },
      );
    }

    const position = await prisma.jobPosition.create({
      data: parsed.data,
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Error creating job position:", error);
    return NextResponse.json(
      { error: "Failed to create job position" },
      { status: 500 },
    );
  }
}
