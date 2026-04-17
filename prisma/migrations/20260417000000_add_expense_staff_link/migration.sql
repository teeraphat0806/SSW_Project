-- Add staff link to Expense without dropping existing data
ALTER TABLE "Expense"
ADD COLUMN IF NOT EXISTS "staffId" INTEGER;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_staffId_fkey"
FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Expense_staffId_idx" ON "Expense"("staffId");