import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { ProductSchema } from '@/lib/schemas/product.schema';
// GET /api/payroll/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor","clerk"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
     try {
        const result = await prisma.product.findUnique({
            where: { id: Number(params.id) },
        });

        return NextResponse.json(result, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ error: "Failed to fetch Product" }, { status: 500 });
    }    
}

// PUT /api/payroll/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor","clerk"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = ProductSchema.partial().safeParse(body); 
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    try{
        const result = await prisma.product.update({
            where: { id: Number(params.id) },
            data: parsed.data,
        });

        return NextResponse.json(result, { status: 200 });
    }catch (error) {
        return NextResponse.json({ error: "Failed to update Product" }, { status: 500 });
    }  
}

// DELETE /api/payroll/[id]
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const { params } = context;
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor","clerk"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        await prisma.product.delete({
            where: { id: Number(params.id) },
        });
    } catch (error) {
        console.error("error: ",error)
        return NextResponse.json({ error: "Failed to delete Product" }, { status: 500 });
    }
    return NextResponse.json({ message: `Delete Complete` });
}

