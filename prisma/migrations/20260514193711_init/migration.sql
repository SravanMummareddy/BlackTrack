-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HandResult" AS ENUM ('WIN', 'LOSS', 'PUSH', 'BLACKJACK', 'SURRENDER');

-- CreateEnum
CREATE TYPE "StrategyAction" AS ENUM ('HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasinoSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "casinoName" TEXT NOT NULL,
    "tableMin" INTEGER NOT NULL,
    "tableMax" INTEGER NOT NULL,
    "decks" INTEGER NOT NULL DEFAULT 6,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "buyIn" INTEGER NOT NULL,
    "cashOut" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "handsPlayed" INTEGER NOT NULL DEFAULT 0,
    "handsWon" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CasinoSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hand" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "handNumber" INTEGER NOT NULL,
    "bet" INTEGER NOT NULL,
    "result" "HandResult" NOT NULL,
    "playerCards" TEXT[],
    "dealerCards" TEXT[],
    "playerTotal" INTEGER NOT NULL,
    "dealerTotal" INTEGER NOT NULL,
    "splitHand" BOOLEAN NOT NULL DEFAULT false,
    "doubled" BOOLEAN NOT NULL DEFAULT false,
    "surrendered" BOOLEAN NOT NULL DEFAULT false,
    "payout" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyScenario" (
    "id" TEXT NOT NULL,
    "playerCards" TEXT[],
    "dealerUpcard" TEXT NOT NULL,
    "playerTotal" INTEGER NOT NULL,
    "isSoft" BOOLEAN NOT NULL,
    "isPair" BOOLEAN NOT NULL,
    "correctAction" "StrategyAction" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "action" "StrategyAction" NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "timeMs" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategyAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "CasinoSession_userId_idx" ON "CasinoSession"("userId");

-- CreateIndex
CREATE INDEX "CasinoSession_startedAt_idx" ON "CasinoSession"("startedAt");

-- CreateIndex
CREATE INDEX "Hand_sessionId_idx" ON "Hand"("sessionId");

-- CreateIndex
CREATE INDEX "Hand_playedAt_idx" ON "Hand"("playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyScenario_playerCards_dealerUpcard_isSoft_isPair_key" ON "StrategyScenario"("playerCards", "dealerUpcard", "isSoft", "isPair");

-- CreateIndex
CREATE INDEX "StrategyAttempt_userId_idx" ON "StrategyAttempt"("userId");

-- CreateIndex
CREATE INDEX "StrategyAttempt_scenarioId_idx" ON "StrategyAttempt"("scenarioId");

-- CreateIndex
CREATE INDEX "StrategyAttempt_attemptedAt_idx" ON "StrategyAttempt"("attemptedAt");

-- AddForeignKey
ALTER TABLE "CasinoSession" ADD CONSTRAINT "CasinoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hand" ADD CONSTRAINT "Hand_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CasinoSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyAttempt" ADD CONSTRAINT "StrategyAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyAttempt" ADD CONSTRAINT "StrategyAttempt_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "StrategyScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
