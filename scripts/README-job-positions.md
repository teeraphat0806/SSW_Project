# คู่มือการเพิ่มข้อมูล JobPosition จากตาราง Staff

สคริปต์นี้จะช่วยเพิ่มข้อมูลตำแหน่งงานเข้าตาราง `JobPosition` โดยดึงข้อมูลจากตำแหน่งที่มีอยู่ในตาราง `Staff`

## 📂 ไฟล์ที่เกี่ยวข้อง

- `insert-job-positions.sql` - SQL script สำหรับรันใน database โดยตรง
- `migrate-job-positions.ts` - TypeScript script สำหรับรันผ่าน Prisma Client (แนะนำ)

## 🚀 วิธีการใช้งาน

### วิธีที่ 1: ใช้ TypeScript Script (แนะนำ)

```bash
# รันสคริปต์
npx tsx scripts/migrate-job-positions.ts
```

**ข้อดี:**

- ตรวจสอบข้อมูลก่อนเพิ่ม
- แสดงรายละเอียดแต่ละตำแหน่ง
- อัพเดท `positionId` ในตาราง Staff อัตโนมัติ
- แสดงสรุปผลลัพธ์

### วิธีที่ 2: ใช้ SQL Script

```bash
# เชื่อมต่อ database
psql -U your_username -d your_database

# รัน SQL script
\i scripts/insert-job-positions.sql
```

## 📊 ตัวเลือกการคำนวณ baseSalary

สคริปต์รองรับ 3 วิธีในการกำหนดเงินเดือนเริ่มต้น:

### 1. ใช้เงินเดือนต่ำสุด (MIN) - **แนะนำ**

เหมาะสำหรับกำหนดเงินเดือนเริ่มต้นของตำแหน่ง

```typescript
const salaryMethod: "min" | "avg" | "max" = "min";
```

### 2. ใช้เงินเดือนเฉลี่ย (AVG)

เหมาะสำหรับตำแหน่งที่มีพนักงานหลายคน

```typescript
const salaryMethod: "min" | "avg" | "max" = "avg";
```

### 3. ใช้เงินเดือนสูงสุด (MAX)

เหมาะสำหรับตำแหน่งที่ต้องการกำหนดระดับสูง

```typescript
const salaryMethod: "min" | "avg" | "max" = "max";
```

**การเปลี่ยนค่า:** แก้ไขในไฟล์ `migrate-job-positions.ts` บรรทัดที่ 71

## 📋 ตัวอย่างผลลัพธ์

```
🔍 กำลังดึงข้อมูลตำแหน่งจาก Staff...

📊 พบตำแหน่งทั้งหมด 4 ตำแหน่ง:

   ฝ่ายขาย
      - เงินเดือนต่ำสุด: 24,000 บาท
      - เงินเดือนเฉลี่ย: 24,500 บาท
      - เงินเดือนสูงสุด: 25,000 บาท
      - จำนวนพนักงาน: 2 คน

   จัดส่ง
      - เงินเดือนต่ำสุด: 18,000 บาท
      - เงินเดือนเฉลี่ย: 18,250 บาท
      - เงินเดือนสูงสุด: 18,500 บาท
      - จำนวนพนักงาน: 2 คน

💾 กำลังเพิ่มตำแหน่งใหม่ 4 ตำแหน่ง...

   ✓ เพิ่ม: ฝ่ายขาย (24,000 บาท)
   ✓ เพิ่ม: จัดส่ง (18,000 บาท)
   ✓ เพิ่ม: หัวหน้าช่าง (30,000 บาท)
   ✓ เพิ่ม: ช่างตัดเหล็ก (20,000 บาท)

✅ เพิ่มตำแหน่งสำเร็จ 4 ตำแหน่ง

🔄 กำลังอัพเดท positionId ในตาราง Staff...
✅ อัพเดทสำเร็จ 7 รายการ

📋 สรุปผลลัพธ์:
   ฝ่ายขาย: 2 คน (เงินเดือนเริ่มต้น: 24,000 บาท)
   จัดส่ง: 2 คน (เงินเดือนเริ่มต้น: 18,000 บาท)
   หัวหน้าช่าง: 2 คน (เงินเดือนเริ่มต้น: 30,000 บาท)
   ช่างตัดเหล็ก: 1 คน (เงินเดือนเริ่มต้น: 20,000 บาท)

🎉 เสร็จสิ้น!
```

## ⚙️ การทำงานของสคริปต์

1. **ดึงข้อมูล**: ดึงตำแหน่งที่ไม่ซ้ำกันจาก `Staff.position`
2. **คำนวณเงินเดือน**: คำนวณ baseSalary จาก `currentSalary` ตามวิธีที่เลือก
3. **ตรวจสอบซ้ำ**: ตรวจสอบว่าตำแหน่งนั้นมีใน `JobPosition` แล้วหรือไม่
4. **เพิ่มข้อมูล**: INSERT ตำแหน่งใหม่เข้า `JobPosition`
5. **อัพเดทความสัมพันธ์**: UPDATE `Staff.positionId` ให้ชี้ไปยัง `JobPosition.id`

## ⚠️ ข้อควรระวัง

- สคริปต์จะไม่เพิ่มตำแหน่งที่มีอยู่แล้วใน `JobPosition` (ป้องกันข้อมูลซ้ำ)
- หาก `Staff.position` เป็น `NULL` หรือว่างเปล่า จะข้ามรายการนั้น
- หลังรันสคริปต์ ควรตรวจสอบว่าพนักงานทุกคนมี `positionId` แล้ว

## 🔍 คำสั่งตรวจสอบข้อมูล

### ดูตำแหน่งที่มีอยู่

```sql
SELECT * FROM "JobPosition" ORDER BY name;
```

### ดู Staff พร้อมตำแหน่ง

```sql
SELECT
    s.id,
    s.code,
    s.position,
    jp.name as job_position_name,
    jp."baseSalary",
    s."currentSalary"
FROM "Staff" s
LEFT JOIN "JobPosition" jp ON s."positionId" = jp.id
ORDER BY s.id;
```

### หาพนักงานที่ยังไม่มี positionId

```sql
SELECT * FROM "Staff" WHERE "positionId" IS NULL;
```

## 🛠️ การแก้ไขปัญหา

### ปัญหา: พนักงานบางคนยังไม่มี positionId

**สาเหตุ**: ชื่อตำแหน่งใน `Staff.position` อาจไม่ตรงกับ `JobPosition.name`

**วิธีแก้**:

```sql
UPDATE "Staff" s
SET "positionId" = jp.id,
    "updatedAt" = NOW()
FROM "JobPosition" jp
WHERE TRIM(s.position) = TRIM(jp.name)
    AND s."positionId" IS NULL;
```

### ปัญหา: ต้องการเปลี่ยน baseSalary

**วิธีแก้**:

```sql
UPDATE "JobPosition"
SET "baseSalary" = 25000,
    "updatedAt" = NOW()
WHERE name = 'ฝ่ายขาย';
```

## 📝 หมายเหตุ

- หลังจากมีระบบ `JobPosition` แล้ว ควรใช้ `positionId` แทน `position` (String)
- สามารถลบ field `position` ออกจาก schema ได้ในอนาคต
- baseSalary เป็นเงินเดือนเริ่มต้นของตำแหน่ง ไม่ใช่เงินเดือนปัจจุบันของพนักงาน
