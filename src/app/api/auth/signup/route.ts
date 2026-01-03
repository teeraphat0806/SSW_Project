import prisma from "../../../../lib/prisma";
import type { NextRequest } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      name,
      bankName,
      bankAccount,
      taxid,
      startDate,
      code,
      social_security,
      currentSalary,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return Response.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create User and Staff atomically within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if email already exists
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Check if code already exists
      if (code) {
        const existingCode = await tx.staff.findUnique({
          where: { code },
        });
        if (existingCode) {
          throw new Error("Staff code already exists");
        }
      }

      // Create User
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "guest",
        },
      });

      // Create Staff record with userId reference
      const staff = await tx.staff.create({
        data: {
          user: {
            connect: { id: user.id },
          },
          bankName: bankName || "N/A",
          bankAccount: bankAccount || `ACC_${user.id}`,
          taxid: taxid || `TAX_${user.id}`,
          startDate: startDate ? new Date(startDate) : new Date(),
          code: code || `EMP_${user.id}`,
          social_security: social_security || `SS_${user.id}`,
          currentSalary: currentSalary ? parseInt(currentSalary) : 0,
          position: "clerk", // Default position
        },
      });

      return { user, staff };
    });

    return Response.json({
      message: "User and Staff created successfully",
      user: result.user,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (errorMessage.includes("already exists")) {
      return Response.json({ error: errorMessage }, { status: 400 });
    }

    return Response.json(
      {
        error: `User could not be created because: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
