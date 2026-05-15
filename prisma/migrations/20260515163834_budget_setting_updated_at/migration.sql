/*
  Warnings:

  - Added the required column `updatedAt` to the `BudgetSetting` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BudgetSetting_userId_effectiveFrom_idx";

-- AlterTable
ALTER TABLE "BudgetSetting" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
