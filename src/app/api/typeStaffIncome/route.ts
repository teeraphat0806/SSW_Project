import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse , NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { TypeStaffIncomeSchema } from "../../../lib/schemas/typeStaffIncome.schema";
export async function GET(req: NextRequest) {
    const session = await getServerSession({ req, ...authOptions });
    // Fix: Only allow if role is superadmin OR supervisor
    console.log("Session:", session);
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        const result = await prisma.typeStaffIncome.findMany({});

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch typeStaffIncome"+error }, { status: 500 });
    }
}
export async function POST(req: NextRequest){
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }

    const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
    const parsed = TypeStaffIncomeSchema.safeParse(body); // ✅ ตรวจสอบ schema

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data format", details: parsed.error.flatten() }, { status: 400 });
    }
    
    try {
        const result = await prisma.typeStaffIncome.create({
            data: parsed.data, // ✅ ใช้ข้อมูลที่ผ่านการตรวจสอบแล้ว
        });
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to create typeStaffIncome" }, { status: 500 });
    }
}