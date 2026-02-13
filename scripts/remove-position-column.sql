-- Manual migration script to remove position column from Staff table
-- Run this script if Prisma migrate fails due to shadow database issues
-- 
-- Note: Make sure you have already migrated data from position to JobPosition
-- and updated Staff.positionId before running this script

-- Remove the position column from Staff table
ALTER TABLE "Staff" DROP COLUMN IF EXISTS "position";

-- Verify the column has been removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Staff' 
  AND table_schema = 'public';
