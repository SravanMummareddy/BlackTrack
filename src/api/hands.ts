import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import * as handService from '../services/hand-service';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import { schemas } from '../utils/validation';

const router = Router({ mergeParams: true });

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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

const updateHandSchema = logHandSchema.partial().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one field is required' }
);

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

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(logHandSchema, req.body);
  const hand = await handService.logHand(req.userId!, req.params.sessionId, input);
  res.status(201).json({ data: hand });
}));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const pagination = parseQuery(schemas.pagination, req.query);
  const result = await handService.listHands(
    req.userId!,
    req.params.sessionId,
    pagination.page ?? 1,
    pagination.pageSize ?? 20
  );
  res.status(200).json(result);
}));

router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await handService.getSessionStats(req.userId!, req.params.sessionId);
  res.status(200).json({ data: stats });
}));

router.patch('/:handId', asyncHandler(async (req: Request, res: Response) => {
  const input = parseBody(updateHandSchema, req.body);
  const hand = await handService.updateHand(req.userId!, req.params.sessionId, req.params.handId, input);
  res.status(200).json({ data: hand });
}));

router.delete('/:handId', asyncHandler(async (req: Request, res: Response) => {
  await handService.deleteHand(req.userId!, req.params.sessionId, req.params.handId);
  res.status(204).send();
}));

export default router;
