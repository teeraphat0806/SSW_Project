import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { StaffSalarySchema } from '../../../../lib/schemas/staffSalary.schema';
import prisma from "@/lib/prisma";
// GET /api/payroll/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
     try {
        const result = await prisma.staffSalary.findUnique({
            where: { id: Number(params.id) },
        });

        return NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: "Failed to fetch staffSalary" }, { status: 500 });
    }    
}

// PUT /api/payroll/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = StaffSalarySchema.partial().safeParse(body); 
    if(!parsed.success){
        return NextResponse.json({error: "Invalid data format"},{status: 400})
    }
    
    try {
        const result = await prisma.staffSalary.update({
            where: { id: Number(params.id) },
            data: parsed.data,
        });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update staffSalary" }, { status: 500 });
    }
}

// DELETE /api/payroll/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        await prisma.staffSalary.delete({
            where: { id: Number(params.id) },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete staffSalary" }, { status: 500 });
    }
    return NextResponse.json({ message: `Delete Complete` });
}

