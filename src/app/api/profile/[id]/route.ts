import prisma from "@/lib/prisma";
export async function GET(request: Request, { params }: { params: { id: number } }) {
    const { id } = params;
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }
        return Response.json(user);
    } catch (error) {
        return Response.json({ error: `Error fetching user data: ${error}` }, { status: 500 });
    }
}