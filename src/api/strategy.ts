import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as strategyService from '../services/strategy-service';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';

const router = Router();

const scenarioQuerySchema = z.object({
  difficulty: z.coerce.number().int().min(1).max(3).optional(),
  isSoft: z.coerce.boolean().optional(),
  isPair: z.coerce.boolean().optional(),
});

const attemptSchema = z.object({
  scenarioId: z.string().uuid('Invalid scenario ID'),
  action: z.enum(['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER']),
  timeMs: z.number().int().min(0).optional(),
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

router.get('/scenarios/random', async (req: Request, res: Response) => {
  const filters = parseQuery(scenarioQuerySchema, req.query);
  const scenario = await strategyService.getRandomScenario(filters);
  res.status(200).json({ data: scenario });
});

router.get('/scenarios/:id', async (req: Request, res: Response) => {
  const scenario = await strategyService.getScenarioById(req.params.id);
  res.status(200).json({ data: scenario });
});

router.post('/attempts', async (req: Request, res: Response) => {
  const input = parseBody(attemptSchema, req.body);
  const result = await strategyService.submitAttempt(
    req.userId!,
    input.scenarioId,
    input.action,
    input.timeMs
  );
  res.status(201).json({ data: result });
});

router.get('/progress', async (req: Request, res: Response) => {
  const progress = await strategyService.getUserProgress(req.userId!);
  res.status(200).json({ data: progress });
});

export default router;
