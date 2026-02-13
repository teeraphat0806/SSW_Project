# คำอธิบาย: Script แก้ไข PostgreSQL Sequence

## ปัญหาที่เจอ

```
Error: Unique constraint failed on the fields: (`id`)
```

## สาเหตุ

PostgreSQL sequence (ตัวสร้าง ID อัตโนมัติ) ไม่ตรงกับ ID ที่มีอยู่จริงในตาราง

### ตัวอย่าง:

```
ตาราง User มี ID: 1, 2, 3, 5, 8 (MAX = 8)
แต่ sequence บอกว่า ID ถัดไปจะเป็น: 3

เมื่อสร้าง User ใหม่ → ได้ ID = 3 → ❌ ERROR! (เพราะมี ID 3 อยู่แล้ว)
```

## วิธีแก้ Script นี้ทำอะไร

### ก่อนรัน Script:

```sql
User Table: [ID: 1, 2, 3, 5, 8]
Sequence next value: 3  ← เลขซ้ำ!
```

### หลังรัน Script:

```sql
User Table: [ID: 1, 2, 3, 5, 8]  ← ข้อมูลเดิมไม่เปลี่ยน!
Sequence next value: 9  ← ตั้งใหม่ให้ถูก (MAX + 1)
```

### User ใหม่ที่สร้างต่อไป:

```sql
สมัครสมาชิกใหม่ → ได้ ID = 9 ✅ ไม่ซ้ำ!
```

## สิ่งที่ไม่เกิดขึ้น

❌ **ไม่ลบข้อมูล**: User/Staff เดิมทั้งหมดยังอยู่
❌ **ไม่แก้ไข ID**: User.id = 1,2,3,5,8 ยังเป็น 1,2,3,5,8
❌ **ไม่กระทบ Foreign Keys**:

```sql
Staff.userId = 2 → ยังชี้ไป User.id = 2
Bill.salesNameId = 5 → ยังชี้ไป Staff.id = 5
OrderPO.customerId = 3 → ยังชี้ไป Customer.id = 3
```

## สิ่งที่เกิดขึ้น

✅ **Sequence ถูกแก้**: ตั้งให้ ID ถัดไปเป็น MAX(id) + 1
✅ **User ใหม่จะมี ID ไม่ซ้ำ**: 9, 10, 11, 12...
✅ **แก้ปัญหา signup error**: สามารถสมัครสมาชิกได้ปกติ

## วิธีใช้

### ตัวเลือกที่ 1: ใช้ TypeScript Script

```bash
npx tsx scripts/fix-sequences.ts
```

### ตัวเลือกที่ 2: ใช้ SQL โดยตรง

```bash
# เชื่อมต่อ database แล้วรัน:
psql -h <host> -U <username> -d <database> -f scripts/fix-id-sequence.sql
```

### ตัวเลือกที่ 3: Copy/Paste ใน Database Client

เปิด pgAdmin, DBeaver, หรือ Prisma Studio แล้ว copy SQL จากไฟล์ไปรัน

## ตัวอย่าง Output

```
┌───────────┬──────────────────────────┬────────┬──────────┐
│ table_name│ sequence_name            │ max_id │ next_val │
├───────────┼──────────────────────────┼────────┼──────────┤
│ User      │ User_id_seq              │ 8      │ 9        │
│ Staff     │ Staff_id_seq             │ 15     │ 16       │
└───────────┴──────────────────────────┴────────┴──────────┘
```

✅ หลังรัน script: ID ถัดไปจะเป็น 9 (User) และ 16 (Staff)

## สรุป

**ปลอดภัย 100%** - แค่แก้ไขตัวนับ ID ให้ถูกต้อง ไม่กระทบข้อมูลเดิมและ relationships
