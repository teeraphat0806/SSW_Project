import prisma from "../../../../../lib/prisma";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const users = await prisma.user.findMany({
      where: { id: id },
    });
    return Response.json(users);
  } catch (error) {
    return Response.json({ error: `Error fetching user data: ${error}` });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  const { name, email, role } = await request.json();

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
      },
    });

    return Response.json({ message: "User updated successfully", user });
  } catch (error) {
    return Response.json(
      { error: `Error updating user: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }
  try {
    const user = await prisma.user.delete({
      where: { id: id },
    });
    return Response.json({ message: "User deleted successfully", user });
  } catch (error) {
    return Response.json(
      { error: `Error deleting user: ${error}` },
      { status: 500 }
    );
  }
}
