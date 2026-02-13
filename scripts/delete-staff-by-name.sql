-- สคริปต์ลบพนักงานชื่อ "ธีราพัฒน์ จิรภาสนิธิเลิศ" และข้อมูลที่เกี่ยวข้องทั้งหมด
-- ⚠️ คำเตือน: การลบนี้ไม่สามารถย้อนกลับได้!

-- ขั้นตอนที่ 1: หา Staff ID
DO $$
DECLARE
    target_staff_id INT;
    target_user_id INT;
BEGIN
    -- ค้นหา Staff ID และ User ID ของพนักงานที่ต้องการลบ
    SELECT s.id, s."userId" 
    INTO target_staff_id, target_user_id
    FROM "Staff" s
    JOIN "User" u ON s."userId" = u.id
    WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ';

    -- ตรวจสอบว่าพบพนักงานหรือไม่
    IF target_staff_id IS NULL THEN
        RAISE NOTICE 'ไม่พบพนักงานชื่อ "ธีราพัฒน์ จิรภาสนิธิเลิศ"';
        RETURN;
    END IF;

    RAISE NOTICE 'พบพนักงาน Staff ID: %, User ID: %', target_staff_id, target_user_id;

    -- ขั้นตอนที่ 2: ลบข้อมูลในตาราง OrderPOStaff
    DELETE FROM "OrderPOStaff" WHERE "staffId" = target_staff_id;
    RAISE NOTICE 'ลบข้อมูลจาก OrderPOStaff เรียบร้อย';

    -- ขั้นตอนที่ 3: ลบข้อมูลในตาราง StaffIncome
    DELETE FROM "StaffIncome" WHERE "staffId" = target_staff_id;
    RAISE NOTICE 'ลบข้อมูลจาก StaffIncome เรียบร้อย';

    -- ขั้นตอนที่ 4: ลบข้อมูลในตาราง StaffSalary
    DELETE FROM "StaffSalary" WHERE "staffId" = target_staff_id;
    RAISE NOTICE 'ลบข้อมูลจาก StaffSalary เรียบร้อย';

    -- ขั้นตอนที่ 5: ลบข้อมูลในตาราง ExpenseCategory
    -- (เก็บ Expense ไว้ แต่ลบ category ที่สร้างโดย staff คนนี้)
    DELETE FROM "Expense" WHERE "categoryId" IN (
        SELECT id FROM "ExpenseCategory" WHERE "staffId" = target_staff_id
    );
    DELETE FROM "ExpenseCategory" WHERE "staffId" = target_staff_id;
    RAISE NOTICE 'ลบข้อมูลจาก ExpenseCategory และ Expense ที่เกี่ยวข้อง เรียบร้อย';

    -- ขั้นตอนที่ 6: จัดการตาราง Bill
    -- Option A: ลบ Bill ทั้งหมดที่เกี่ยวข้อง (ระวัง! อาจจะลบข้อมูลสำคัญ)
    -- DELETE FROM "Bill" WHERE "salesNameId" = target_staff_id OR "deliveredById" = target_staff_id;
    
    -- Option B: SET NULL สำหรับ deliveredById (nullable) และลบเฉพาะ Bill ที่เป็น sales (not nullable)
    UPDATE "Bill" SET "deliveredById" = NULL WHERE "deliveredById" = target_staff_id;
    RAISE NOTICE 'อัปเดต Bill.deliveredById เป็น NULL';
    
    -- ⚠️ ถ้ามี Bill ที่ salesNameId = staff คนนี้ จะต้องลบหรือเปลี่ยน salesNameId
    -- แนะนำให้ตรวจสอบก่อนว่ามีกี่รายการ:
    RAISE NOTICE 'จำนวน Bill ที่ staff คนนี้เป็น sales: %', (
        SELECT COUNT(*) FROM "Bill" WHERE "salesNameId" = target_staff_id
    );
    
    -- หากต้องการลบ Bill ที่ staff คนนี้เป็น sales ให้ uncomment บรรทัดนี้:
    DELETE FROM "Bill" WHERE "salesNameId" = target_staff_id;
    RAISE NOTICE 'ลบ Bill ที่ staff คนนี้เป็น sales เรียบร้อย';

    -- ขั้นตอนที่ 7: ลบข้อมูลในตาราง Staff
    DELETE FROM "Staff" WHERE id = target_staff_id;
    RAISE NOTICE 'ลบข้อมูลจาก Staff เรียบร้อย';

    -- ขั้นตอนที่ 8: ลบข้อมูลในตาราง User
    IF target_user_id IS NOT NULL THEN
        DELETE FROM "User" WHERE id = target_user_id;
        RAISE NOTICE 'ลบข้อมูลจาก User เรียบร้อย';
    END IF;

    RAISE NOTICE '✅ ลบพนักงาน "ธีราพัฒน์ จิรภาสนิธิเลิศ" และข้อมูลที่เกี่ยวข้องทั้งหมดเรียบร้อยแล้ว';
END $$;

-- ตรวจสอบผลลัพธ์
SELECT 'User' as table_name, COUNT(*) as count FROM "User" WHERE name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ'
UNION ALL
SELECT 'Staff', COUNT(*) FROM "Staff" s JOIN "User" u ON s."userId" = u.id WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ';
