import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { TypeStaffIncomeSchema } from '../../../../lib/schemas/typeStaffIncome.schema';
import prisma from "@/lib/prisma";
// GET /api/payroll/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
     try {
        const result = await prisma.typeStaffIncome.findUnique({
            where: { id: Number(params.id) },
        });

        return NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: "Failed to fetch typeStaffIncome" }, { status: 500 });
    }    
}

// PUT /api/payroll/[id]
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ⬅️ ต้องเป็น Promise และ await
) {
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 403 });
  }

  const { id } = await ctx.params; // ⬅️ await params
  const idNum = Number(id);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = TypeStaffIncomeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  // กรอง undefined ออก เพื่อไม่ overwrite ค่าเดิมด้วย undefined
  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const result = await prisma.typeStaffIncome.update({
      where: { id: idNum },
      data,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update typeStaffIncome" },
      { status: 500 }
    );
  }
}

// DELETE /api/typeStaffIncome/[id]
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // ⬅️ ต้องเป็น Promise และ await
) {
  const session = await getServerSession({ req, ...authOptions });
  if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Permission Denied!!" }, { status: 403 });
  }

  const { id } = await ctx.params; // ⬅️ await params
  const idNum = Number(id);
  if (Number.isNaN(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await prisma.typeStaffIncome.delete({ where: { id: idNum } });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete typeStaffIncome" },
      { status: 500 }
    );
  }
}

