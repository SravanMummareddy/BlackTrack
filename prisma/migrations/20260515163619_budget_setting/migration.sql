-- CreateTable
CREATE TABLE "BudgetSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetSetting_userId_effectiveFrom_idx" ON "BudgetSetting"("userId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetSetting_userId_effectiveFrom_key" ON "BudgetSetting"("userId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "BudgetSetting" ADD CONSTRAINT "BudgetSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
