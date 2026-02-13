-- ====================================================================
-- สคริปต์สำหรับอัพเดท positionId ให้กับพนักงานในตาราง Staff
-- โดยจับคู่จากชื่อตำแหน่งกับตาราง JobPosition
-- ====================================================================

-- ==================================================
-- 1. ตรวจสอบข้อมูลก่อนอัพเดท
-- ==================================================

-- ดูพนักงานที่ยังไม่มี positionId
SELECT 
    s.id,
    s.code,
    s.position as staff_position,
    s."positionId" as current_position_id,
    jp.id as job_position_id,
    jp.name as job_position_name,
    jp."baseSalary"
FROM "Staff" s
LEFT JOIN "JobPosition" jp ON s.position = jp.name
WHERE s."positionId" IS NULL
ORDER BY s.id;

-- นับจำนวนพนักงานที่จะได้รับการอัพเดท
SELECT COUNT(*) as พนักงานที่จะอัพเดท
FROM "Staff" s
INNER JOIN "JobPosition" jp ON s.position = jp.name
WHERE s."positionId" IS NULL;


-- ==================================================
-- 2. อัพเดท positionId ให้กับพนักงานทั้งหมด
-- ==================================================

UPDATE "Staff" s
SET "positionId" = jp.id,
    "updatedAt" = NOW()
FROM "JobPosition" jp
WHERE s.position = jp.name
    AND s."positionId" IS NULL;


-- ==================================================
-- 3. อัพเด트แบบบังคับทุกคน (กรณีต้องการอัพเดทแม้มี positionId อยู่แล้ว)
-- ==================================================

-- UPDATE "Staff" s
-- SET "positionId" = jp.id,
--     "updatedAt" = NOW()
-- FROM "JobPosition" jp
-- WHERE s.position = jp.name;


-- ==================================================
-- 4. อัพเดทเฉพาะตำแหน่งเดียว
-- ==================================================

-- ตัวอย่าง: อัพเดทเฉพาะพนักงานตำแหน่ง "ฝ่ายขาย"
-- UPDATE "Staff" s
-- SET "positionId" = jp.id,
--     "updatedAt" = NOW()
-- FROM "JobPosition" jp
-- WHERE s.position = jp.name
--     AND s.position = 'ฝ่ายขาย';


-- ==================================================
-- 5. อัพเดทด้วย TRIM (กรณีมีช่องว่าง)
-- ==================================================

-- UPDATE "Staff" s
-- SET "positionId" = jp.id,
--     "updatedAt" = NOW()
-- FROM "JobPosition" jp
-- WHERE TRIM(s.position) = TRIM(jp.name)
--     AND s."positionId" IS NULL;


-- ==================================================
-- 6. ตรวจสอบผลลัพธ์หลังอัพเดท
-- ==================================================

-- ดูพนักงานทั้งหมดพร้อมข้อมูลตำแหน่ง
SELECT 
    s.id,
    s.code,
    COALESCE(u.name, s."staffName") as staff_name,
    s.position as old_position_field,
    s."positionId",
    jp.name as job_position_name,
    jp."baseSalary" as position_base_salary,
    s."currentSalary" as staff_current_salary
FROM "Staff" s
LEFT JOIN "JobPosition" jp ON s."positionId" = jp.id
LEFT JOIN "User" u ON s."userId" = u.id
ORDER BY s.id;

-- นับจำนวนพนักงานตามตำแหน่ง
SELECT 
    jp.id,
    jp.name,
    jp."baseSalary",
    COUNT(s.id) as staff_count
FROM "JobPosition" jp
LEFT JOIN "Staff" s ON s."positionId" = jp.id
GROUP BY jp.id, jp.name, jp."baseSalary"
ORDER BY staff_count DESC, jp.name;

-- หาพนักงานที่ยังไม่มี positionId
SELECT 
    s.id,
    s.code,
    s.position,
    s."positionId"
FROM "Staff" s
WHERE s."positionId" IS NULL;

-- หาพนักงานที่ position ไม่ตรงกับ JobPosition
SELECT 
    s.id,
    s.code,
    s.position as staff_position,
    'ไม่มีในระบบ' as status
FROM "Staff" s
WHERE s.position NOT IN (SELECT name FROM "JobPosition")
    AND s.position IS NOT NULL
    AND s.position != '';


-- ==================================================
-- 7. แก้ไขปัญหาพนักงานที่ยังไม่มี positionId
-- ==================================================

-- กรณีที่ 1: position เป็น NULL หรือว่าง
-- SELECT id, code, position, "positionId"
-- FROM "Staff"
-- WHERE (position IS NULL OR position = '')
--     AND "positionId" IS NULL;

-- แก้ไข: ตั้งค่า position ด้วยตัวเอง
-- UPDATE "Staff"
-- SET position = 'พนักงานทั่วไป',
--     "updatedAt" = NOW()
-- WHERE (position IS NULL OR position = '')
--     AND "positionId" IS NULL;


-- กรณีที่ 2: ชื่อตำแหน่งไม่ตรง
-- ตัวอย่าง: Staff.position = 'sale' แต่ JobPosition.name = 'ฝ่ายขาย'
-- UPDATE "Staff"
-- SET position = 'ฝ่ายขาย',
--     "updatedAt" = NOW()
-- WHERE position = 'sale';


-- ==================================================
-- 8. สถิติและข้อมูลเพิ่มเติม
-- ==================================================

-- เงินเดือนเฉลี่ยของแต่ละตำแหน่ง
SELECT 
    jp.name as position,
    jp."baseSalary" as base_salary,
    COUNT(s.id) as staff_count,
    MIN(s."currentSalary") as min_salary,
    AVG(s."currentSalary") as avg_salary,
    MAX(s."currentSalary") as max_salary
FROM "JobPosition" jp
LEFT JOIN "Staff" s ON s."positionId" = jp.id
GROUP BY jp.id, jp.name, jp."baseSalary"
ORDER BY jp.name;

-- พนักงานที่มีเงินเดือนน้อยกว่า baseSalary ของตำแหน่ง
SELECT 
    s.id,
    s.code,
    COALESCE(u.name, s."staffName") as staff_name,
    jp.name as position,
    s."currentSalary",
    jp."baseSalary",
    (s."currentSalary" - jp."baseSalary") as difference
FROM "Staff" s
INNER JOIN "JobPosition" jp ON s."positionId" = jp.id
LEFT JOIN "User" u ON s."userId" = u.id
WHERE s."currentSalary" < jp."baseSalary"
ORDER BY difference;
