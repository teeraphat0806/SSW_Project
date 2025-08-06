import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { UserSchema } from '@/lib/schemas/user.schema';
import prisma from "@/lib/prisma";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await prisma.user.findUnique({
         where: { id: Number(params.id) },
        });
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }
        return Response.json(user);
    } catch (error) {
        return Response.json({ error: `Error fetching user data: ${error}` }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor","clerk","cutter","delivery"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = UserSchema.partial().safeParse(body); 
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    try{
        const result = await prisma.user.update({
            where: { id: Number(params.id) },
            data: parsed.data,
        });

        return NextResponse.json(result, { status: 200 });
    }catch (error) {
        return NextResponse.json({ error: "Failed to update User" }, { status: 500 });
    }  
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        await prisma.user.delete({
            where: { id: Number(params.id) },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete User" }, { status: 500 });
    }
    return NextResponse.json({ message: `Delete Complete` });
}