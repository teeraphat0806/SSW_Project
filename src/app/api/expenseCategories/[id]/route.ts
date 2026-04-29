import { requireAuth } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authRequest = await requireAuth(["superadmin", "clerk", "supervisor"]);
  if ("response" in authRequest) {
    return authRequest.response;
  }

  try {
    const { id } = await params;
    const categoryId = parseInt(id);

    console.log(
      `🔵 DELETE /api/expenseCategories/${id} - categoryId: ${categoryId}`,
    );

    // Check if category exists
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      console.log(`❌ Category not found: ${categoryId}`);
      return NextResponse.json(
        { error: "ไม่พบประเภทค่าใช้จ่ายที่ต้องการลบ" },
        { status: 404 },
      );
    }

    console.log(
      `📊 Category found: ${category.name}, Expense count: ${category._count.expenses}`,
    );

    // Check if category is being used in any expense records
    if (category._count.expenses > 0) {
      console.log(
        `❌ Cannot delete: ${category._count.expenses} expenses using this category`,
      );
      return NextResponse.json(
        {
          error: `ไม่สามารถลบประเภท "${category.name}" ได้ เนื่องจากมีค่าใช้จ่าย ${category._count.expenses} รายการที่ใช้ประเภทนี้อยู่ กรุณาลบข้อมูลในตาราง expense หรือเปลี่ยนประเภทของรายการเหล่านั้นก่อน`,
        },
        { status: 400 },
      );
    }

    // Delete the category
    await prisma.expenseCategory.delete({
      where: { id: categoryId },
    });

    console.log(`✅ Category deleted successfully: ${category.name}`);

    return NextResponse.json(
      { message: `ลบประเภท "${category.name}" สำเร็จ` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting expense category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
