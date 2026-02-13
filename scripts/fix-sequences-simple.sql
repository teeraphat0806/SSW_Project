-- Copy คำสั่งนี้ไปรันใน database client ของคุณ
-- (Railway Dashboard, pgAdmin, DBeaver, หรือ Prisma Studio)

-- Fix User sequence
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 1), true);

-- Fix Staff sequence  
SELECT setval(pg_get_serial_sequence('"Staff"', 'id'), COALESCE((SELECT MAX(id) FROM "Staff"), 1), true);

-- ตรวจสอบผลลัพธ์
SELECT 'User' as table_name, MAX(id) as max_id FROM "User"
UNION ALL
SELECT 'Staff', MAX(id) FROM "Staff";
