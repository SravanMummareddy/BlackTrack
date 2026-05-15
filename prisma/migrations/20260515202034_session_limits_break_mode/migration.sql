-- AlterTable
ALTER TABLE "CasinoSession" ADD COLUMN     "lossLimitCents" INTEGER,
ADD COLUMN     "timeLimitMinutes" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "breakUntil" TIMESTAMP(3);
