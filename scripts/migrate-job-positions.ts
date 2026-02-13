/**
 * สคริปต์สำหรับเพิ่มข้อมูลเข้าตาราง JobPosition
 * โดยดึงข้อมูลจากตำแหน่งที่มีอยู่ในตาราง Staff
 *
 * วิธีใช้งาน:
 * npx tsx scripts/migrate-job-positions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateJobPositions() {
  try {
    console.log("🔍 กำลังดึงข้อมูลตำแหน่งจาก Staff...");

    // ดึงตำแหน่งที่ไม่ซ้ำกันพร้อมข้อมูลเงินเดือน
    const positions = await prisma.$queryRaw<
      Array<{
        position: string;
        min_salary: number;
        avg_salary: number;
        max_salary: number;
        staff_count: bigint;
      }>
    >`
      SELECT 
        position,
        MIN("currentSalary") as min_salary,
        AVG("currentSalary") as avg_salary,
        MAX("currentSalary") as max_salary,
        COUNT(*) as staff_count
      FROM "Staff"
      WHERE position IS NOT NULL 
        AND position != ''
      GROUP BY position
      ORDER BY position
    `;

    console.log(`\n📊 พบตำแหน่งทั้งหมด ${positions.length} ตำแหน่ง:\n`);

    positions.forEach((pos) => {
      console.log(`   ${pos.position}`);
      console.log(
        `      - เงินเดือนต่ำสุด: ${pos.min_salary.toLocaleString()} บาท`,
      );
      console.log(
        `      - เงินเดือนเฉลี่ย: ${Math.round(Number(pos.avg_salary)).toLocaleString()} บาท`,
      );
      console.log(
        `      - เงินเดือนสูงสุด: ${pos.max_salary.toLocaleString()} บาท`,
      );
      console.log(`      - จำนวนพนักงาน: ${pos.staff_count} คน\n`);
    });

    // ตรวจสอบว่ามีตำแหน่งไหนอยู่ใน JobPosition แล้วบ้าง
    const existingPositions = await prisma.jobPosition.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existingPositions.map((p) => p.name));

    // กรองเฉพาะตำแหน่งที่ยังไม่มีใน JobPosition
    const newPositions = positions.filter(
      (pos) => !existingNames.has(pos.position),
    );

    if (newPositions.length === 0) {
      console.log(
        "✅ ตำแหน่งทั้งหมดมีอยู่ใน JobPosition แล้ว ไม่ต้องเพิ่มข้อมูลใหม่",
      );
      return;
    }

    console.log(
      `\n💾 กำลังเพิ่มตำแหน่งใหม่ ${newPositions.length} ตำแหน่ง...\n`,
    );

    // เลือกวิธีคำนวณ baseSalary (เปลี่ยนได้ตามต้องการ)
    // 'min' = ต่ำสุด, 'avg' = เฉลี่ย, 'max' = สูงสุด
    const salaryMethod = "min" as "min" | "avg" | "max";

    // สร้าง JobPosition ใหม่
    const createdPositions = [];
    for (const pos of newPositions) {
      let baseSalary: number;

      switch (salaryMethod) {
        case "min":
          baseSalary = pos.min_salary;
          break;
        case "avg":
          baseSalary = Math.round(Number(pos.avg_salary));
          break;
        case "max":
          baseSalary = pos.max_salary;
          break;
        default:
          baseSalary = pos.min_salary;
          break;
      }

      const created = await prisma.jobPosition.create({
        data: {
          name: pos.position,
          baseSalary: baseSalary,
        },
      });

      createdPositions.push(created);
      console.log(
        `   ✓ เพิ่ม: ${created.name} (${baseSalary.toLocaleString()} บาท)`,
      );
    }

    console.log(`\n✅ เพิ่มตำแหน่งสำเร็จ ${createdPositions.length} ตำแหน่ง`);

    // อัพเดท positionId ในตาราง Staff
    console.log(`\n🔄 กำลังอัพเดท positionId ในตาราง Staff...`);

    const updatedCount = await prisma.$executeRaw`
      UPDATE "Staff" s
      SET "positionId" = jp.id,
          "updatedAt" = NOW()
      FROM "JobPosition" jp
      WHERE s.position = jp.name
        AND s."positionId" IS NULL
    `;

    console.log(`✅ อัพเดทสำเร็จ ${updatedCount} รายการ\n`);

    // แสดงสรุปผลลัพธ์
    console.log("📋 สรุปผลลัพธ์:");
    const summary = await prisma.staff.groupBy({
      by: ["positionId"],
      _count: true,
      where: {
        positionId: {
          not: null,
        },
      },
    });

    for (const item of summary) {
      const position = await prisma.jobPosition.findUnique({
        where: { id: item.positionId! },
      });
      console.log(
        `   ${position?.name}: ${item._count} คน (เงินเดือนเริ่มต้น: ${position?.baseSalary.toLocaleString()} บาท)`,
      );
    }

    const staffWithoutPosition = await prisma.staff.count({
      where: {
        positionId: null,
      },
    });

    if (staffWithoutPosition > 0) {
      console.log(
        `\n⚠️  พนักงานที่ยังไม่มี positionId: ${staffWithoutPosition} คน`,
      );
    }
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// รันสคริปต์
migrateJobPositions()
  .then(() => {
    console.log("\n🎉 เสร็จสิ้น!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ สคริปต์ล้มเหลว:", error);
    process.exit(1);
  });
