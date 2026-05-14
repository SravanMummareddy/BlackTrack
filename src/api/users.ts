import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import { schemas } from '../utils/validation';

const router = Router();

const updateMeSchema = z.object({
  name: schemas.name.optional(),
  email: schemas.email.optional(),
});

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
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

router.use(authenticate);

router.get('/me', async (req: Request, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.status(200).json({ data: user });
});

router.patch('/me', async (req: Request, res: Response) => {
  const input = parseBody(updateMeSchema, req.body);
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: input,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.status(200).json({ data: user });
});

router.get('/me/stats', async (req: Request, res: Response) => {
  const userId = req.userId!;

  const [sessions, handAggregate] = await Promise.all([
    prisma.casinoSession.findMany({
      where: { userId },
      select: {
        id: true,
        buyIn: true,
        cashOut: true,
        handsPlayed: true,
        handsWon: true,
        status: true,
      },
    }),
    prisma.hand.aggregate({
      where: { session: { userId } },
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

  res.status(200).json({
    data: {
      sessionsPlayed: sessions.length,
      completedSessions: completedSessions.length,
      activeSessions: sessions.filter((session) => session.status === 'ACTIVE').length,
      totalBuyIn,
      completedBuyIn,
      totalCashOut,
      netProfit,
      roi: completedBuyIn > 0 ? netProfit / completedBuyIn : null,
      handsPlayed,
      handsWon,
      winRate: handsPlayed > 0 ? handsWon / handsPlayed : null,
      totalBet: handAggregate._sum.bet ?? 0,
      totalPayout: handAggregate._sum.payout ?? 0,
      averageBet: handAggregate._avg.bet === null ? null : Math.round(handAggregate._avg.bet),
    },
  });
});

export default router;
