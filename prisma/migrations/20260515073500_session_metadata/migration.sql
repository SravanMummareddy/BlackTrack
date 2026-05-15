-- AlterTable
ALTER TABLE "CasinoSession"
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "moodStart" INTEGER,
  ADD COLUMN "moodEnd" INTEGER,
  ADD COLUMN "completionNotes" TEXT;
