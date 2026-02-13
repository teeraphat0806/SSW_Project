-- ลบ column position ออกจากตาราง Staff
-- ⚠️ คำเตือน: ข้อมูลใน column position จะหายถาวร!
-- ตรวจสอบให้แน่ใจว่าได้ migrate ข้อมูลไปยัง JobPosition แล้ว

-- ตรวจสอบว่ามี column position อยู่จริงหรือไม่
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Staff' 
  AND column_name = 'position'
  AND table_schema = 'public';

-- ลบ column position
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "position";

-- ตรวจสอบว่าลบสำเร็จแล้ว (ควรได้ผลลัพธ์ 0 rows)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Staff' 
  AND column_name = 'position'
  AND table_schema = 'public';

-- แสดง columns ที่เหลือในตาราง Staff
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Staff'
  AND table_schema = 'public'
ORDER BY ordinal_position;
