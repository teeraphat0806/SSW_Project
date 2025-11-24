import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
){
    const session = await getServerSession({ req, ...authOptions });
    if(!session || !["superadmin","supervisor","clerk"].includes(session.user?.role)){
        return NextResponse.json({error:"Permission Denied!!"},{status:400});
    }

    try{
        const result = await prisma.steelType.findMany({});
        return NextResponse.json(result,{status:200});

    }catch(e){
        console.error(e);
        return NextResponse.json({error:"Failed to fetch steel type"},{status:500});
    }
}

    