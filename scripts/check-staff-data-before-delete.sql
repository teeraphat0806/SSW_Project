-- สคริปต์ตรวจสอบข้อมูลของพนักงานก่อนลบ
-- รันสคริปต์นี้ก่อนเพื่อดูว่ามีข้อมูลอะไรที่จะถูกลบบ้าง

-- ค้นหาข้อมูลพื้นฐาน
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    u.role,
    s.id as staff_id,
    s.code as staff_code,
    s."currentSalary"
FROM "User" u
LEFT JOIN "Staff" s ON s."userId" = u.id
WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ';

-- นับจำนวนข้อมูลที่เกี่ยวข้องในแต่ละตาราง
WITH staff_info AS (
    SELECT s.id as staff_id
    FROM "Staff" s
    JOIN "User" u ON s."userId" = u.id
    WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ'
)
SELECT 
    'OrderPOStaff' as table_name,
    COUNT(*) as record_count
FROM "OrderPOStaff" ops
WHERE ops."staffId" IN (SELECT staff_id FROM staff_info)

UNION ALL

SELECT 
    'StaffIncome',
    COUNT(*)
FROM "StaffIncome" si
WHERE si."staffId" IN (SELECT staff_id FROM staff_info)

UNION ALL

SELECT 
    'StaffSalary',
    COUNT(*)
FROM "StaffSalary" ss
WHERE ss."staffId" IN (SELECT staff_id FROM staff_info)

UNION ALL

SELECT 
    'ExpenseCategory',
    COUNT(*)
FROM "ExpenseCategory" ec
WHERE ec."staffId" IN (SELECT staff_id FROM staff_info)

UNION ALL

SELECT 
    'Bill (as sales)',
    COUNT(*)
FROM "Bill" b
WHERE b."salesNameId" IN (SELECT staff_id FROM staff_info)

UNION ALL

SELECT 
    'Bill (as delivery)',
    COUNT(*)
FROM "Bill" b
WHERE b."deliveredById" IN (SELECT staff_id FROM staff_info);

-- แสดงรายละเอียด Bill ที่เกี่ยวข้อง (สำคัญ!)
SELECT 
    b.id as bill_id,
    b."codeCustomer",
    b."deliveryDate",
    b."grandTotal",
    CASE 
        WHEN b."salesNameId" IN (SELECT s.id FROM "Staff" s JOIN "User" u ON s."userId" = u.id WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ')
        THEN 'Sales Person'
        ELSE NULL
    END as role_sales,
    CASE 
        WHEN b."deliveredById" IN (SELECT s.id FROM "Staff" s JOIN "User" u ON s."userId" = u.id WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ')
        THEN 'Delivery Person'
        ELSE NULL
    END as role_delivery
FROM "Bill" b
WHERE b."salesNameId" IN (
    SELECT s.id FROM "Staff" s 
    JOIN "User" u ON s."userId" = u.id 
    WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ'
)
OR b."deliveredById" IN (
    SELECT s.id FROM "Staff" s 
    JOIN "User" u ON s."userId" = u.id 
    WHERE u.name = 'ธีราพัฒน์ จิรภาสนิธิเลิศ'
);
