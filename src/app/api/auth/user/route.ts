import prisma from "../../../../lib/prisma";
export async function GET() {
  const authResult = await requireAuth([
    "superadmin",
    "supervisor",
    "clerk",
    "delivery",
  ]);

  if ("response" in authResult) {
    return authResult.response;
  }
  const { session } = authResult;
  console.log(session);
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: `Error fetching user data: ${error}` });
  }
}
