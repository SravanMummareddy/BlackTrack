import { prisma } from '../database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import type { CasinoSession, SessionStatus } from '@prisma/client';

export interface CreateSessionInput {
  casinoName: string;
  tableMin: number;
  tableMax: number;
  decks?: number;
  buyIn: number;
  notes?: string;
}

export interface UpdateSessionInput {
  casinoName?: string;
  notes?: string;
  cashOut?: number;
  status?: SessionStatus;
}

export interface PaginatedSessions {
  data: (CasinoSession & { netProfit: number | null })[];
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
): Promise<CasinoSession> {
  return prisma.casinoSession.create({
    data: {
      userId,
      casinoName: input.casinoName,
      tableMin: input.tableMin,
      tableMax: input.tableMax,
      decks: input.decks ?? 6,
      buyIn: input.buyIn,
      notes: input.notes,
    },
  });
}

export async function listSessions(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedSessions> {
  const [sessions, total] = await Promise.all([
    prisma.casinoSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.casinoSession.count({ where: { userId } }),
  ]);

  return {
    data: sessions.map((s) => ({
      ...s,
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
): Promise<CasinoSession> {
  const session = await prisma.casinoSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new NotFoundError('Session');
  if (session.userId !== userId) throw new ForbiddenError();
  return session;
}

export async function updateSession(
  userId: string,
  sessionId: string,
  input: UpdateSessionInput
): Promise<CasinoSession> {
  const existing = await getSession(userId, sessionId);

  const data: Record<string, unknown> = {};
  if (input.casinoName !== undefined) data.casinoName = input.casinoName;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.cashOut !== undefined) data.cashOut = input.cashOut;
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === 'COMPLETED') {
      if (!existing.endedAt) data.endedAt = new Date();
    }
  }

  return prisma.casinoSession.update({ where: { id: sessionId }, data });
}

export async function deleteSession(
  userId: string,
  sessionId: string
): Promise<void> {
  await getSession(userId, sessionId);
  await prisma.casinoSession.delete({ where: { id: sessionId } });
}
