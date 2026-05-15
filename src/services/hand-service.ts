import { prisma } from '../database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { getSession } from './session-service';
import { Prisma } from '@prisma/client';
import type { Hand } from '@prisma/client';

export interface LogHandInput {
  bet: number;
  result: 'WIN' | 'LOSS' | 'PUSH' | 'BLACKJACK' | 'SURRENDER';
  playerCards: string[];
  dealerCards: string[];
  playerTotal: number;
  dealerTotal: number;
  splitHand?: boolean;
  doubled?: boolean;
  surrendered?: boolean;
  payout: number;
}

export type UpdateHandInput = Partial<LogHandInput>;

export interface PaginatedHands {
  data: Hand[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SessionStats {
  handsPlayed: number;
  handsWon: number;
  winRate: number | null;
  netProfit: number | null;
  roi: number | null;
  totalBet: number;
  liveNetProfit: number;
  avgBet: number | null;
  biggestWin: Hand | null;
  biggestLoss: Hand | null;
}

export async function logHand(
  userId: string,
  sessionId: string,
  input: LogHandInput
): Promise<Hand> {
  const session = await getSession(userId, sessionId);

  if (session.status !== 'ACTIVE') {
    throw new ConflictError('Session is already completed');
  }

  const isWin = input.result === 'WIN' || input.result === 'BLACKJACK';

  const hand = await prisma.$transaction(async (tx) => {
    const handCount = await tx.hand.count({ where: { sessionId } });
    const created = await tx.hand.create({
      data: {
        sessionId,
        handNumber: handCount + 1,
        bet: input.bet,
        result: input.result,
        playerCards: input.playerCards,
        dealerCards: input.dealerCards,
        playerTotal: input.playerTotal,
        dealerTotal: input.dealerTotal,
        splitHand: input.splitHand ?? false,
        doubled: input.doubled ?? false,
        surrendered: input.surrendered ?? false,
        payout: input.payout,
      },
    });
    await tx.casinoSession.update({
      where: { id: sessionId },
      data: {
        handsPlayed: { increment: 1 },
        ...(isWin && { handsWon: { increment: 1 } }),
      },
    });
    return created;
  });

  return hand;
}

export async function updateHand(
  userId: string,
  sessionId: string,
  handId: string,
  input: UpdateHandInput
): Promise<Hand> {
  await getSession(userId, sessionId);

  const existing = await prisma.hand.findFirst({ where: { id: handId, sessionId } });
  if (!existing) throw new NotFoundError('Hand');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.hand.update({
      where: { id: handId },
      data: input,
    });
    await recalculateSessionCounters(tx, sessionId);
    return updated;
  });
}

export async function deleteHand(
  userId: string,
  sessionId: string,
  handId: string
): Promise<void> {
  await getSession(userId, sessionId);

  const existing = await prisma.hand.findFirst({ where: { id: handId, sessionId } });
  if (!existing) throw new NotFoundError('Hand');

  await prisma.$transaction(async (tx) => {
    await tx.hand.delete({ where: { id: handId } });
    await recalculateSessionCounters(tx, sessionId);
  });
}

export async function listHands(
  userId: string,
  sessionId: string,
  page: number,
  pageSize: number
): Promise<PaginatedHands> {
  await getSession(userId, sessionId);

  const [hands, total] = await Promise.all([
    prisma.hand.findMany({
      where: { sessionId },
      orderBy: { handNumber: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.hand.count({ where: { sessionId } }),
  ]);

  return {
    data: hands,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getSessionStats(
  userId: string,
  sessionId: string
): Promise<SessionStats> {
  const session = await getSession(userId, sessionId);

  const hands = await prisma.hand.findMany({ where: { sessionId } });

  const handsPlayed = session.handsPlayed;
  const handsWon = session.handsWon;
  const winRate = handsPlayed > 0 ? handsWon / handsPlayed : null;

  const netProfit = session.cashOut !== null ? session.cashOut - session.buyIn : null;
  const roi =
    netProfit !== null && session.buyIn > 0 ? netProfit / session.buyIn : null;

  const totalBet = hands.reduce((sum, h) => sum + h.bet, 0);
  const liveNetProfit = hands.reduce((sum, h) => sum + h.payout, 0);
  const avgBet = handsPlayed > 0 ? totalBet / handsPlayed : null;

  const biggestWin =
    hands.length > 0
      ? hands.reduce((max, h) => (h.payout > max.payout ? h : max), hands[0])
      : null;

  const biggestLoss =
    hands.length > 0
      ? hands.reduce((min, h) => (h.payout < min.payout ? h : min), hands[0])
      : null;

  return {
    handsPlayed,
    handsWon,
    winRate,
    netProfit,
    roi,
    totalBet,
    liveNetProfit,
    avgBet,
    biggestWin,
    biggestLoss,
  };
}

async function recalculateSessionCounters(
  tx: Prisma.TransactionClient,
  sessionId: string
): Promise<void> {
  const [handsPlayed, handsWon] = await Promise.all([
    tx.hand.count({ where: { sessionId } }),
    tx.hand.count({ where: { sessionId, result: { in: ['WIN', 'BLACKJACK'] } } }),
  ]);

  await tx.casinoSession.update({
    where: { id: sessionId },
    data: { handsPlayed, handsWon },
  });
}
