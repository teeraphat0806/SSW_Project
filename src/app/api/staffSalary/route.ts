import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse , NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { StaffSalarySchema } from "../../../lib/schemas/staffSalary.schema";

export async function GET(req: NextRequest) {
    const session = await getServerSession({ req, ...authOptions });
    // Fix: Only allow if role is superadmin OR supervisor
    console.log("Session:", session);
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        const result = await prisma.staffSalary.findMany({
            include: {
                Staff: {
                    select: { name: true , position: true , bankAccount: true, startAt: true, code: true,social_security: true,Salary: true}
                }
            }
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch staffSalary" }, { status: 500 });
    }
}
export async function POST(req: NextRequest){
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    const body = await req.json();
    const dateNow = new Date()
    const requestBody = {...body,effectiveDate: dateNow}
    const parsed = StaffSalarySchema.partial().safeParse(requestBody);
    
    if(!parsed.success){
        return NextResponse.json({error: "Invalid data format"})
    }
    try {
        const result = await prisma.staffSalary.create({
            data:  parsed.data,
        })
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create staffSalary" }, { status: 500 });
    }
} 