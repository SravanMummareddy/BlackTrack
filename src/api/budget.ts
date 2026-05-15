import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import {
  getMonthlyBudgetView,
  setBudget,
  listBudgetHistory,
  monthStartUtc,
} from '../services/budget-service';
import { prisma } from '../database';

const router = Router();
router.use(authenticate);

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

router.get('/me/budget', async (req: Request, res: Response) => {
  const view = await getMonthlyBudgetView(req.userId!);
  res.status(200).json({ data: view });
});

const putBudgetSchema = z.object({
  amountCents: z.number().int().min(100, 'Budget must be at least $1'),
  effectiveFrom: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

router.put('/me/budget', async (req: Request, res: Response) => {
  const input = parseBody(putBudgetSchema, req.body);
  const effective = input.effectiveFrom ?? monthStartUtc(new Date());

  if (
    effective.getUTCDate() !== 1 ||
    effective.getUTCHours() !== 0 ||
    effective.getUTCMinutes() !== 0 ||
    effective.getUTCSeconds() !== 0 ||
    effective.getUTCMilliseconds() !== 0
  ) {
    throw new ValidationError([
      { field: 'effectiveFrom', message: 'Must be the first day of a month at 00:00 UTC' },
    ]);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { createdAt: true },
  });
  if (effective.getTime() < monthStartUtc(user.createdAt).getTime()) {
    throw new ValidationError([
      { field: 'effectiveFrom', message: 'Cannot set budget before account creation' },
    ]);
  }

  const row = await setBudget(req.userId!, input.amountCents, effective);
  res.status(200).json({ data: row });
});

router.get('/me/budget/history', async (req: Request, res: Response) => {
  const rows = await listBudgetHistory(req.userId!);
  res.status(200).json({ data: rows });
});

export default router;
