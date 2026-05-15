import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate } from '../middleware';
import { ValidationError, UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors';
import { schemas } from '../utils/validation';
import { hashPassword, verifyPassword } from '../auth/passwords';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const updateMeSchema = z.object({
  name: schemas.name.optional(),
  email: schemas.email.optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: schemas.password,
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const statsQuerySchema = z.object({
  period: z.enum(['all', 'year', 'month', 'week']).default('all'),
});

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const details = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    throw new ValidationError(details);
  }
  return result.data;
}

function parseQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const details = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    throw new ValidationError(details);
  }
  return result.data;
}

router.use(authenticate);

router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User');
  res.status(200).json({ data: user });
}));

router.patch('/me', asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(updateMeSchema, req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: input,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.status(200).json({ data: user });
}));

router.patch('/me/password', asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(updatePasswordSchema, req.body);
  const user = await getPasswordUser(req.userId!);
  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Current password is incorrect');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });

  res.status(204).send();
}));

router.get('/me/export', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [user, sessions, budgetSettings, strategyAttempts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.casinoSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        hands: { orderBy: { handNumber: 'asc' } },
      },
    }),
    prisma.budgetSetting.findMany({
      where: { userId },
      orderBy: { effectiveFrom: 'desc' },
    }),
    prisma.strategyAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      include: {
        scenario: true,
      },
    }),
  ]);

  if (!user) throw new NotFoundError('User');

  res.status(200).json({
    data: {
      exportedAt: new Date().toISOString(),
      user,
      sessions,
      budgetSettings,
      strategyAttempts,
    },
  });
}));

router.delete('/me', asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(deleteAccountSchema, req.body);
  const user = await getPasswordUser(req.userId!);
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Password is incorrect');

  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).send();
}));

router.get('/me/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { period = 'all' } = parseQuery(statsQuerySchema, req.query);
  const startedAtFilter = getPeriodStart(period);
  const sessionWhere = {
    userId,
    ...(startedAtFilter ? { startedAt: { gte: startedAtFilter } } : {}),
  };

  const [sessions, handAggregate] = await Promise.all([
    prisma.casinoSession.findMany({
      where: sessionWhere,
      select: {
        id: true,
        casinoName: true,
        buyIn: true,
        cashOut: true,
        handsPlayed: true,
        handsWon: true,
        status: true,
        startedAt: true,
      },
    }),
    prisma.hand.aggregate({
      where: {
        session: sessionWhere,
      },
      _sum: { bet: true, payout: true },
      _avg: { bet: true },
    }),
  ]);

  const completedSessions = sessions.filter((session) => session.cashOut !== null);
  const completedBuyIn = completedSessions.reduce((sum, session) => sum + session.buyIn, 0);
  const totalBuyIn = sessions.reduce((sum, session) => sum + session.buyIn, 0);
  const totalCashOut = completedSessions.reduce((sum, session) => sum + (session.cashOut ?? 0), 0);
  const handsPlayed = sessions.reduce((sum, session) => sum + session.handsPlayed, 0);
  const handsWon = sessions.reduce((sum, session) => sum + session.handsWon, 0);
  const netProfit = totalCashOut - completedBuyIn;
  const sessionsWon = completedSessions.filter((session) => (session.cashOut ?? 0) > session.buyIn).length;
  const sessionsLost = completedSessions.filter((session) => (session.cashOut ?? 0) < session.buyIn).length;
  const completedSessionWinRate =
    completedSessions.length > 0 ? sessionsWon / completedSessions.length : null;
  const averageSessionNet =
    completedSessions.length > 0 ? Math.round(netProfit / completedSessions.length) : null;
  const topCasinos = summarizeCasinoBreakdown(sessions);

  res.status(200).json({
    data: {
      period,
      windowStart: startedAtFilter?.toISOString() ?? null,
      sessionsPlayed: sessions.length,
      completedSessions: completedSessions.length,
      activeSessions: sessions.filter((session) => session.status === 'ACTIVE').length,
      sessionsWon,
      sessionsLost,
      completedSessionWinRate,
      totalBuyIn,
      completedBuyIn,
      totalCashOut,
      netProfit,
      roi: completedBuyIn > 0 ? netProfit / completedBuyIn : null,
      averageSessionNet,
      handsPlayed,
      handsWon,
      winRate: handsPlayed > 0 ? handsWon / handsPlayed : null,
      totalBet: handAggregate._sum.bet ?? 0,
      totalPayout: handAggregate._sum.payout ?? 0,
      averageBet: handAggregate._avg.bet === null ? null : Math.round(handAggregate._avg.bet),
      topCasinos,
    },
  });
}));

export default router;

function getPeriodStart(period: 'all' | 'year' | 'month' | 'week'): Date | null {
  if (period === 'all') return null;

  const now = new Date();
  const start = new Date(now);

  if (period === 'year') {
    start.setFullYear(now.getFullYear() - 1);
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1);
  } else {
    start.setDate(now.getDate() - 7);
  }

  return start;
}

async function getPasswordUser(userId: string): Promise<{ id: string; passwordHash: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new NotFoundError('User');
  if (!user.passwordHash) throw new ConflictError('Password authentication is not enabled for this account');
  return { id: user.id, passwordHash: user.passwordHash };
}

function summarizeCasinoBreakdown(
  sessions: Array<{
    casinoName: string;
    buyIn: number;
    cashOut: number | null;
    handsPlayed: number;
    handsWon: number;
    status: 'ACTIVE' | 'COMPLETED';
  }>
) {
  const grouped = new Map<string, {
    casinoName: string;
    sessionsPlayed: number;
    completedSessions: number;
    totalBuyIn: number;
    totalCashOut: number;
    netProfit: number;
    handsPlayed: number;
    handsWon: number;
    activeSessions: number;
  }>();

  for (const session of sessions) {
    const existing = grouped.get(session.casinoName) ?? {
      casinoName: session.casinoName,
      sessionsPlayed: 0,
      completedSessions: 0,
      totalBuyIn: 0,
      totalCashOut: 0,
      netProfit: 0,
      handsPlayed: 0,
      handsWon: 0,
      activeSessions: 0,
    };

    existing.sessionsPlayed += 1;
    existing.totalBuyIn += session.buyIn;
    existing.handsPlayed += session.handsPlayed;
    existing.handsWon += session.handsWon;

    if (session.status === 'ACTIVE') {
      existing.activeSessions += 1;
    }

    if (session.cashOut !== null) {
      existing.completedSessions += 1;
      existing.totalCashOut += session.cashOut;
      existing.netProfit += session.cashOut - session.buyIn;
    }

    grouped.set(session.casinoName, existing);
  }

  return Array.from(grouped.values())
    .map((casino) => ({
      ...casino,
      averageSessionNet:
        casino.completedSessions > 0 ? Math.round(casino.netProfit / casino.completedSessions) : null,
      winRate: casino.handsPlayed > 0 ? casino.handsWon / casino.handsPlayed : null,
      roi: casino.totalBuyIn > 0 ? casino.netProfit / casino.totalBuyIn : null,
    }))
    .sort((left, right) => right.netProfit - left.netProfit || right.sessionsPlayed - left.sessionsPlayed)
    .slice(0, 5);
}
