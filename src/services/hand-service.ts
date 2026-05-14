import { prisma } from '../database';
import { ConflictError } from '../utils/errors';
import { getSession } from './session-service';
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
    avgBet,
    biggestWin,
    biggestLoss,
  };
}
