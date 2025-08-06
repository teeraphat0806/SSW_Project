import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse , NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { RcptorgSchema } from "@/lib/schemas/rcptorg.schema";
export async function GET(req: NextRequest) {
    const session = await getServerSession({ req, ...authOptions });
    // Fix: Only allow if role is superadmin OR supervisor
    console.log("Session:", session);
    if (!session || !["superadmin", "supervisor","clerk"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }
    try {
        const result = await prisma.rcptorg.findMany({});

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch Rcptorg" }, { status: 500 });
    }
}
export async function POST(req: NextRequest){
    const session = await getServerSession({ req, ...authOptions });
    if (!session || !["superadmin", "supervisor","clerk"].includes(session.user?.role)) {
        return NextResponse.json({ error: "Permission Denied!!" }, { status: 400 });
    }

    const body = await req.json(); // ✅ อ่าน JSON แค่ครั้งเดียว
    const parsed = RcptorgSchema.partial().safeParse(body); // ✅ ตรวจสอบ schema
    const rcptorgData = { ...parsed.data, date: new Date() }

    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid data format", details: parsed.error.flatten() }, { status: 400 });
    }
    
    try {
        const result = await prisma.rcptorg.create({
            data: rcptorgData, // ✅ ใช้ข้อมูลที่ผ่านการตรวจสอบแล้ว
        });
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: "Failed to create Rcptorg" }, { status: 500 });
    }
}