-- สคริปต์สำหรับเพิ่มข้อมูลเข้าตาราง JobPosition
-- โดยดึงข้อมูลจากตำแหน่งที่มีอยู่ในตาราง Staff

-- ==================================================
-- วิธีที่ 1: ใช้เงินเดือนต่ำสุดของแต่ละตำแหน่งเป็น baseSalary
-- (แนะนำ: เหมาะสำหรับกำหนดเงินเดือนเริ่มต้น)
-- ==================================================

INSERT INTO "JobPosition" (name, "baseSalary", "createdAt", "updatedAt")
SELECT 
    position as name,
    MIN("currentSalary") as "baseSalary",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM "Staff"
WHERE position IS NOT NULL 
    AND position != ''
    AND position NOT IN (SELECT name FROM "JobPosition") -- ป้องกันข้อมูลซ้ำ
GROUP BY position
ORDER BY position;


-- ==================================================
-- วิธีที่ 2: ใช้เงินเดือนเฉลี่ยของแต่ละตำแหน่งเป็น baseSalary
-- ==================================================

-- INSERT INTO "JobPosition" (name, "baseSalary", "createdAt", "updatedAt")
-- SELECT 
--     position as name,
--     AVG("currentSalary") as "baseSalary",
--     NOW() as "createdAt",
--     NOW() as "updatedAt"
-- FROM "Staff"
-- WHERE position IS NOT NULL 
--     AND position != ''
--     AND position NOT IN (SELECT name FROM "JobPosition")
-- GROUP BY position
-- ORDER BY position;


-- ==================================================
-- วิธีที่ 3: ใช้เงินเดือนสูงสุดของแต่ละตำแหน่งเป็น baseSalary
-- ==================================================

-- INSERT INTO "JobPosition" (name, "baseSalary", "createdAt", "updatedAt")
-- SELECT 
--     position as name,
--     MAX("currentSalary") as "baseSalary",
--     NOW() as "createdAt",
--     NOW() as "updatedAt"
-- FROM "Staff"
-- WHERE position IS NOT NULL 
--     AND position != ''
--     AND position NOT IN (SELECT name FROM "JobPosition")
-- GROUP BY position
-- ORDER BY position;


-- ==================================================
-- ตรวจสอบข้อมูลก่อน INSERT (Preview)
-- ==================================================

-- SELECT 
--     position as name,
--     MIN("currentSalary") as "baseSalary_MIN",
--     AVG("currentSalary") as "baseSalary_AVG",
--     MAX("currentSalary") as "baseSalary_MAX",
--     COUNT(*) as staff_count
-- FROM "Staff"
-- WHERE position IS NOT NULL 
--     AND position != ''
--     AND position NOT IN (SELECT name FROM "JobPosition")
-- GROUP BY position
-- ORDER BY position;


-- ==================================================
-- หลังจาก INSERT เสร็จแล้ว ให้อัพเดท positionId ในตาราง Staff
-- ==================================================

UPDATE "Staff" s
SET "positionId" = jp.id,
    "updatedAt" = NOW()
FROM "JobPosition" jp
WHERE s.position = jp.name
    AND s."positionId" IS NULL;


-- ==================================================
-- ตรวจสอบผลลัพธ์หลังอัพเดท
-- ==================================================

-- SELECT 
--     s.id,
--     s.code,
--     s.position,
--     s."positionId",
--     jp.name as job_position_name,
--     jp."baseSalary",
--     s."currentSalary"
-- FROM "Staff" s
-- LEFT JOIN "JobPosition" jp ON s."positionId" = jp.id
-- ORDER BY s.id;
