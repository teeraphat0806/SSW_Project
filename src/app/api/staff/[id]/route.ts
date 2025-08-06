import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { StaffSchema } from "@/lib/schemas/staff.schema";
// GET /api/payroll/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
     try {
        const result = await prisma.staff.findUnique({
            where: { id: Number(params.id) },
        });

        return NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: "Failed to fetch payrolls" }, { status: 500 });
    }    
}

// PUT /api/payroll/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = StaffSchema.partial().safeParse(body); 
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    try{
        const result = await prisma.staff.update({
            where: { id: Number(params.id) },
            data: parsed.data,
        });

        return NextResponse.json(result, { status: 200 });
    }catch (error) {
        return NextResponse.json({ error: "Failed to update staff income" }, { status: 500 });
    }  
}

// DELETE /api/payroll/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        await prisma.staff.delete({
            where: { id: Number(params.id) },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete payroll" }, { status: 500 });
    }
    return NextResponse.json({ message: `Delete Complete` });
}

