import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as handService from '../services/hand-service';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import { schemas } from '../utils/validation';

const router = Router({ mergeParams: true });

const cardsField = z.string().array().min(2);

const logHandSchema = z.object({
  bet: z.number().int().min(0),
  result: z.enum(['WIN', 'LOSS', 'PUSH', 'BLACKJACK', 'SURRENDER']),
  playerCards: cardsField,
  dealerCards: cardsField,
  playerTotal: z.number().int().min(1).max(21),
  dealerTotal: z.number().int().min(1).max(21),
  splitHand: z.boolean().optional(),
  doubled: z.boolean().optional(),
  surrendered: z.boolean().optional(),
  payout: z.number().int(),
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

function parseQuery<T>(schema: z.ZodType<T>, query: unknown): T {
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

router.post('/', async (req: Request, res: Response) => {
  const input = parseBody(logHandSchema, req.body);
  const hand = await handService.logHand(req.userId!, req.params.sessionId, input);
  res.status(201).json({ data: hand });
});

router.get('/', async (req: Request, res: Response) => {
  const pagination = parseQuery(schemas.pagination, req.query);
  const result = await handService.listHands(
    req.userId!,
    req.params.sessionId,
    pagination.page ?? 1,
    pagination.pageSize ?? 20
  );
  res.status(200).json(result);
});

router.get('/stats', async (req: Request, res: Response) => {
  const stats = await handService.getSessionStats(req.userId!, req.params.sessionId);
  res.status(200).json({ data: stats });
});

export default router;
