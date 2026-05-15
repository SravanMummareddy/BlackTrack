import { prisma } from '../database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import type { CasinoSession, SessionStatus } from '@prisma/client';

export interface CreateSessionInput {
  casinoName: string;
  tableMin: number;
  tableMax: number;
  decks?: number;
  buyIn: number;
  notes?: string;
  tags?: string[];
  moodStart?: number;
}

export interface UpdateSessionInput {
  casinoName?: string;
  tableMin?: number;
  tableMax?: number;
  decks?: number;
  buyIn?: number;
  notes?: string;
  cashOut?: number;
  status?: SessionStatus;
  tags?: string[];
  moodStart?: number;
  moodEnd?: number;
  completionNotes?: string;
}

export type SessionWithProfit = CasinoSession & {
  liveNetProfit: number;
  netProfit: number | null;
};

export interface PaginatedSessions {
  data: SessionWithProfit[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<SessionWithProfit> {
  const data: Prisma.CasinoSessionUncheckedCreateInput = {
    userId,
    casinoName: input.casinoName,
    tableMin: input.tableMin,
    tableMax: input.tableMax,
    decks: input.decks ?? 6,
    buyIn: input.buyIn,
    notes: input.notes,
    tags: input.tags ?? [],
    moodStart: input.moodStart,
  };

  const session = await prisma.casinoSession.create({
    data,
  });

  return attachSessionProfit(session);
}

export async function listSessions(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedSessions> {
  const [sessions, liveProfitRows, total] = await Promise.all([
    prisma.casinoSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.hand.groupBy({
      by: ['sessionId'],
      where: { session: { userId } },
      _sum: { payout: true },
    }),
    prisma.casinoSession.count({ where: { userId } }),
  ]);
  const liveProfitBySession = new Map(
    liveProfitRows.map((row) => [row.sessionId, row._sum.payout ?? 0])
  );

  return {
    data: sessions.map((s) => ({
      ...s,
      liveNetProfit: liveProfitBySession.get(s.id) ?? 0,
      netProfit: s.cashOut !== null ? s.cashOut - s.buyIn : null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getSession(
  userId: string,
  sessionId: string
): Promise<SessionWithProfit> {
  const session = await prisma.casinoSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError('Session');
  if (session.userId !== userId) throw new ForbiddenError();
  return attachSessionProfit(session);
}

export async function updateSession(
  userId: string,
  sessionId: string,
  input: UpdateSessionInput
): Promise<SessionWithProfit> {
  const existing = await getSession(userId, sessionId);

  const data: Prisma.CasinoSessionUpdateInput = {};
  if (input.casinoName !== undefined) data.casinoName = input.casinoName;
  if (input.tableMin !== undefined) data.tableMin = input.tableMin;
  if (input.tableMax !== undefined) data.tableMax = input.tableMax;
  if (input.decks !== undefined) data.decks = input.decks;
  if (input.buyIn !== undefined) data.buyIn = input.buyIn;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.cashOut !== undefined) data.cashOut = input.cashOut;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.moodStart !== undefined) data.moodStart = input.moodStart;
  if (input.moodEnd !== undefined) data.moodEnd = input.moodEnd;
  if (input.completionNotes !== undefined) data.completionNotes = input.completionNotes;
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === 'COMPLETED') {
      if (!existing.endedAt) data.endedAt = new Date();
    } else {
      data.endedAt = null;
      data.cashOut = null;
    }
  }

  const session = await prisma.casinoSession.update({ where: { id: sessionId }, data });
  return attachSessionProfit(session);
}

export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<void> {
  await getSession(userId, sessionId);
  await prisma.casinoSession.delete({ where: { id: sessionId } });
}

async function attachSessionProfit(session: CasinoSession): Promise<SessionWithProfit> {
  const aggregate = await prisma.hand.aggregate({
    where: { sessionId: session.id },
    _sum: { payout: true },
  });

  return {
    ...session,
    liveNetProfit: aggregate._sum.payout ?? 0,
    netProfit: session.cashOut !== null ? session.cashOut - session.buyIn : null,
  };
}
