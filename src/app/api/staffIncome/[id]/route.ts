import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
// GET /api/payroll/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
     try {
        const result = await prisma.staffIncome.findUnique({
            where: { id: Number(params.id) },
            include: {
                Staff: {
                    select: { name: true , position: true , bankAccount: true, startAt: true, code: true,social_security: true,Salary: true}
                }
            }
        });

        return NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: "Failed to fetch payrolls" }, { status: 500 });
    }    
}

// PUT /api/payroll/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const data = await req.json();
    try {
        const result = await prisma.staffIncome.update({
            where: { id: Number(params.id) },
            data,
        });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
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
        await prisma.staffIncome.delete({
            where: { id: Number(params.id) },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete payroll" }, { status: 500 });
    }
    return NextResponse.json({ message: `Delete Complete` });
}

