ALTER TABLE "Statement"
ALTER COLUMN "statementNo" DROP DEFAULT;

ALTER TABLE "Statement"
ALTER COLUMN "statementNo" DROP NOT NULL;

DROP INDEX IF EXISTS "Statement_statementNo_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "Statement_statementNo_key"
ON "Statement"("statementNo");