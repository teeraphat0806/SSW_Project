# การลบ field `position` ออกจากตาราง Staff

## สรุปการเปลี่ยนแปลง

### 1. ไฟล์ Type Definitions ที่แก้ไข

- ✅ [src/types/staff.ts](src/types/staff.ts) - เปลี่ยนจาก `position: string` เป็น `jobPosition` relation
- ✅ [src/types/payroll.ts](src/types/payroll.ts) - เปลี่ยนจาก `position: string` เป็น `jobPosition` relation
- ✅ [src/types/next-auth.d.ts](src/types/next-auth.d.ts) - อัปเดต session type ให้ใช้ `jobPosition`
- ✅ [src/contexts/ExpenseContext.tsx](src/contexts/ExpenseContext.tsx) - เปลี่ยน type ของ Staff ให้ใช้ `jobPosition`

### 2. Component Files ที่แก้ไข

- ✅ [src/components/payroll/EmployeeDirectory.tsx](src/components/payroll/EmployeeDirectory.tsx) - ลบ `position: emp.position` ออกจาก editData
- ✅ [src/components/payroll/EmployeeOverview.tsx](src/components/payroll/EmployeeOverview.tsx) - เปลี่ยนจาก `employee.position` เป็น `employee.jobPosition?.name || "-"`
- ✅ [src/components/payroll/StaffIncomeDierectory.tsx](src/components/payroll/StaffIncomeDierectory.tsx) - อัปเดต type definition ให้ใช้ `jobPosition`
- ✅ [src/components/expenseDashboard/ExpenseTable.tsx](src/components/expenseDashboard/ExpenseTable.tsx) - เปลี่ยนจาก `Staff?.position` เป็น `Staff?.jobPosition?.name`
- ✅ [src/lib/saleDashboard/analytics-utils.ts](src/lib/saleDashboard/analytics-utils.ts) - ลบ fallback `|| staffMember?.position`

### 3. API Routes ที่แก้ไข

เปลี่ยนจาก `position: true` เป็น `jobPosition: true` ใน select clauses:

- ✅ [src/app/api/staffSalary/route.ts](src/app/api/staffSalary/route.ts)
- ✅ [src/app/api/staffIncome/route.ts](src/app/api/staffIncome/route.ts)
- ✅ [src/app/api/staffIncome/[id]/route.ts](src/app/api/staffIncome/[id]/route.ts)
- ✅ [src/app/api/staffIncome/[id]/staffId/route.ts](src/app/api/staffIncome/[id]/staffId/route.ts)

### 4. Authentication ที่แก้ไข

- ✅ [src/lib/auth.ts](src/lib/auth.ts) - อัปเดตการ select staff data ให้ใช้ `jobPosition` แทน `position`

### 5. Mock Data ที่แก้ไข

- ✅ [src/data/mockPayrollData.ts](src/data/mockPayrollData.ts) - เปลี่ยนจาก `position: string` เป็น `jobPosition` object

### 6. Prisma Schema

- ✅ [prisma/schema.prisma](prisma/schema.prisma) - ลบ field `position String @default("พนักงานทั่วไป")` ออกจาก model Staff

## การทำ Database Migration

เนื่องจาก Prisma Migrate ไม่สามารถสร้าง shadow database ได้ (PostgreSQL collation version mismatch),
จึงได้สร้าง migration file และ SQL script ไว้แล้ว:

### Migration Files ที่สร้างแล้ว:

1. **prisma/migrations/20250213000000_remove_staff_position_field/migration.sql**
   - Migration file สำหรับ Prisma
2. **scripts/remove-position-column.sql**
   - SQL script ที่สามารถรันได้โดยตรงกับ database

### วิธีการ Apply Migration:

#### ตัวเลือกที่ 1: รัน SQL Script โดยตรง (แนะนำ)

```bash
# เชื่อมต่อกับ PostgreSQL database และรันคำสั่ง:
psql -h shortline.proxy.rlwy.net -p 33566 -U <username> -d railway -f scripts/remove-position-column.sql
```

#### ตัวเลือกที่ 2: รันคำสั่ง SQL ผ่าน Database Client

```sql
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "position";
```

#### ตัวเลือกที่ 3: ใช้ Prisma Studio หรือ Database GUI Tool

1. เปิด Prisma Studio: `npx prisma studio`
2. หรือใช้ Database client เช่น pgAdmin, DBeaver
3. รันคำสั่ง SQL ข้างต้น

### หลังจาก Apply Migration แล้ว:

```bash
# อัปเดต _prisma_migrations table เพื่อบันทึก migration
npx prisma migrate resolve --applied 20250213000000_remove_staff_position_field
```

## การตรวจสอบ

### TypeScript Compilation

✅ ผ่านแล้ว - ไม่มี type errors

```bash
npx tsc --noEmit
```

### Prisma Client Generation

✅ สร้างสำเร็จแล้ว

```bash
npx prisma generate
```

## สิ่งที่ต้องทำต่อ

1. ✅ **อัปเดต Code** - เสร็จสิ้นแล้ว
2. ✅ **สร้าง Migration Files** - เสร็จสิ้นแล้ว
3. ⚠️ **Apply Database Migration** - รอดำเนินการ (รัน SQL script)
4. ⏳ **ทดสอบระบบ** - หลังจาก apply migration

## หมายเหตุ

- ตรวจสอบให้แน่ใจว่าได้รัน migration scripts สำหรับ JobPosition แล้ว (ใน scripts/migrate-job-positions.ts หรือ insert-job-positions.sql)
- ตรวจสอบให้แน่ใจว่าได้อัปเดต Staff.positionId แล้ว (ใน scripts/update-staff-position-id.sql)
- ข้อมูลใน field `position` เก่าจะถูกลบหลังจากรัน migration นี้
- การเปลี่ยนแปลงนี้ไม่สามารถย้อนกลับได้

## ตัวอย่างข้อมูลก่อนและหลังการเปลี่ยนแปลง

### ก่อน:

```typescript
{
  id: 1,
  name: "สมชาย ใจดี",
  position: "นักพัฒนาระบบ", // String field
  positionId: 1
}
```

### หลัง:

```typescript
{
  id: 1,
  name: "สมชาย ใจดี",
  positionId: 1,
  jobPosition: {
    id: 1,
    name: "นักพัฒนาระบบ",
    baseSalary: 35000
  }
}
```
