import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req:NextRequest,
    context: {params: Promise<{ id: string }>}
) {
    const { id } = await context.params;
    const authResult = await requireAuth([
        "superadmin",
        "supervisor",
        "clerk",
      ]);

    if ("response" in authResult) {
        return authResult.response;
    }

    try{
        const result = await prisma.steelType.findUnique({
            where: { id: Number(id) },
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch steelType: " + error },
            { status: 500 },
        );
    }
}