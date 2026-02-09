import { PrismaClient } from "@prisma/client";
import { userData } from "@/data/userData";
import { customerData } from "@/data/customerData";
import { staffData } from "@/data/staffData";
import { billData } from "@/data/billData";
import { staffIncomeData } from "@/data/staffIncomeData";
import { staffSalaryData } from "@/data/staffSalaryData";
import { typeStaffIncomeData } from "@/data/typeStaffIncomeData";
import { steelTypeData } from "@/data/steelTypeData";
import { expenseData } from "@/data/expenseData";
import { expenseCategoryData } from "@/data/expenseCategoryData";
import { steelStockData } from "@/data/steelStockData";

const prisma = new PrismaClient();
async function main() {
  // 1. ลบข้อมูล
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();

  // 2. ลบพวก income/salary ที่ผูกกับ Staff
  await prisma.staffSalary.deleteMany();
  await prisma.staffIncome.deleteMany();

  // 3. ลบพวกที่เกี่ยวกับรายได้ประเภทต่าง ๆ
  await prisma.typeStaffIncome.deleteMany();

  // 4. ลบพวกงาน/บิล/สินค้า/สต็อกเหล็ก
  await prisma.bill.deleteMany();
  await prisma.product.deleteMany();
  await prisma.steelStock.deleteMany();
  await prisma.orderPO.deleteMany();

  // 5. ลบ master data ที่เหลือ
  await prisma.steelType.deleteMany();
  await prisma.customer.deleteMany();

  // 6. ลบ Staff แล้วค่อยลบ User (เพราะ Staff มี FK ไปหา User)
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();

  // 2. รีเซต sequence
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Staff_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "OrderPO_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Bill_id_seq" RESTART WITH 1`);
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "StaffIncome_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "StaffSalary_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "TypeStaffIncome_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "TypeStaffIncome_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "ExpenseCategory_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Expense_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "SteelType_id_seq" RESTART WITH 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER SEQUENCE "Bill_invoiceNo_seq" RESTART WITH 00129326;`
  );

   console.log("✅ reset sequences successfully.");

  //   // 3. ใส่ข้อมูล
  // await prisma.steelType.createMany({ data: steelTypeData });
  // await prisma.user.createMany({ data: userData });
  // // await prisma.staff.createMany({ data: staffData })
  // for (const s of staffData ?? []) {
  //   const user = s.userEmail
  //     ? await prisma.user.findUnique({
  //         where: { email: s.userEmail },
  //         select: { id: true },
  //       })
  //     : null;

  //   await prisma.staff.upsert({
  //     where: { code: s.code }, // code เป็น @unique
  //     update: {
  //       position: s.position,
  //       bankAccount: s.bankAccount,
  //       bankName: s.bankName,
  //       startDate: s.startDate,
  //       social_security: s.social_security,
  //       currentSalary: s.currentSalary,
  //       ...(user ? { user: { connect: { id: user.id } } } : {}),
  //     },
  //     create: {
  //       code: s.code,
  //       position: s.position,
  //       bankAccount: s.bankAccount,
  //       bankName: s.bankName,
  //       taxid: s.taxid,
  //       startDate: s.startDate,
  //       social_security: s.social_security,
  //       currentSalary: s.currentSalary,
  //       ...(user ? { user: { connect: { id: user.id } } } : {}),
  //     },
  //   });
  // }
  // await prisma.customer.createMany({ data: customerData });
  // // await prisma.orderPO.createMany({ data: orderPoData })
  // for (const bill of billData) {
  //   await prisma.bill.create({
  //     data: bill,
  //     include: {
  //       OrderPO: {
  //         include: {
  //           Product: true,
  //         },
  //       },
  //     },
  //   });
  // }
  // // await prisma.bill.createMany({ data: billData })
  // await prisma.typeStaffIncome.createMany({ data: typeStaffIncomeData });
  // await prisma.staffIncome.createMany({ data: staffIncomeData });
  // await prisma.staffSalary.createMany({ data: staffSalaryData });
  // await prisma.expenseCategory.createMany({ data: expenseCategoryData });
  // await prisma.expense.createMany({ data: expenseData });
  // await prisma.steelStock.createMany({ data: steelStockData });

  // console.log("✅ All seed data inserted successfully.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  });
