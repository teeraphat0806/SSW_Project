import { PrismaClient } from '@prisma/client'
import { userData } from '@/data/userData'
import { customerData } from '@/data/customerData'
import { staffData } from '@/data/staffData'
import { orderPoData } from '@/data/orderPoData'
import { billData } from '@/data/billData'
import { rcptorgData } from '@/data/rcptorgData'
import { staffIncomeData } from '@/data/staffIncomeData'
import { temporaryBillData } from '@/data/temporaryBillData'
import { staffSalaryData } from '@/data/staffSalaryData'

const prisma = new PrismaClient()
async function main() {
  // 1. ลบข้อมูล
  await prisma.staffSalary.deleteMany()
  await prisma.staffIncome.deleteMany()
  await prisma.bill.deleteMany()
  await prisma.product.deleteMany()
  await prisma.orderPO.deleteMany()
  await prisma.rcptorg.deleteMany()
  await prisma.temporaryBill.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.staff.deleteMany()

  // 2. รีเซต sequence
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Staff_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "OrderPO_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Bill_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Rcptorg_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "StaffIncome_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TemporaryBill_id_seq" RESTART WITH 1`)
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "StaffSalary_id_seq" RESTART WITH 1`)

  // 3. ใส่ข้อมูล
  await prisma.staff.createMany({ data: staffData })
  await prisma.user.createMany({ data: userData })
  await prisma.customer.createMany({ data: customerData })
  // await prisma.orderPO.createMany({ data: orderPoData })
  for (const bill of billData) {
  await prisma.bill.create({
    data: bill,
    include: {
      OrderPO: {
        include: {
          Product: true
        }
      }
    }
  });
}
  // await prisma.bill.createMany({ data: billData })
  await prisma.rcptorg.createMany({ data: rcptorgData })
  await prisma.staffIncome.createMany({ data: staffIncomeData })
  await prisma.temporaryBill.createMany({ data: temporaryBillData })
  await prisma.staffSalary.createMany({data: staffSalaryData})
  console.log('✅ All seed data inserted successfully.')
}


main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
