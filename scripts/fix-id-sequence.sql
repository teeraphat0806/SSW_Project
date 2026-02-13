-- Script to fix PostgreSQL sequence for User and Staff tables
-- Run this if you encounter "Unique constraint failed on the fields: (`id`)" error
--
-- ⚠️ สิ่งที่ Script นี้ทำ:
-- 1. ดู ID สูงสุดในตาราง User และ Staff (เช่น MAX(id) = 8)
-- 2. ตั้งค่า sequence ให้ ID ถัดไปเป็น 9 (หรือ MAX + 1)
-- 3. ไม่แก้ไขข้อมูลเดิม ไม่กระทบ foreign keys
-- 4. แค่บอก PostgreSQL ว่า "ID ต่อไปที่จะสร้างใหม่ควรเป็นเลขอะไร"
--
-- ✅ ปลอดภัย: ข้อมูลเดิมและ relationships ทั้งหมดจะไม่ถูกแก้ไข

-- Fix User table sequence
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX(id), 1)) FROM "User";

-- Fix Staff table sequence  
SELECT setval(pg_get_serial_sequence('"Staff"', 'id'), COALESCE(MAX(id), 1)) FROM "Staff";

-- Verify sequences
SELECT 
  'User' as table_name,
  pg_get_serial_sequence('"User"', 'id') as sequence_name,
  (SELECT MAX(id) FROM "User") as max_id,
  nextval(pg_get_serial_sequence('"User"', 'id')) as next_val;

SELECT 
  'Staff' as table_name,
  pg_get_serial_sequence('"Staff"', 'id') as sequence_name,
  (SELECT MAX(id) FROM "Staff") as max_id,
  nextval(pg_get_serial_sequence('"Staff"', 'id')) as next_val;
