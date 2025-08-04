import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse , NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession({ req, ...authOptions });
    // Fix: Only allow if role is superadmin OR supervisor
    console.log("Session:", session);
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        const result = await prisma.staffIncome.findMany({
            include: {
                Staff: {
                    select: { name: true , position: true , bankAccount: true, startAt: true, code: true,social_security: true,Salary: true}
                }
            }
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch payrolls" }, { status: 500 });
    }
}
export async function POST(req: NextRequest){
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        if(!req.body) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }
        const result = await prisma.staffIncome.create({
            data: await req.json(),
        })
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create staff income" }, { status: 500 });
    }
} 