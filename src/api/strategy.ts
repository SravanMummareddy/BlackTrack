import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as strategyService from '../services/strategy-service';
import { getReferenceChart } from '../services/strategy-chart';
import { ILLUSTRIOUS_18 } from '../services/deviation-indices';
import { generateCountDrill } from '../services/count-drill';
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

router.get('/chart', (_req: Request, res: Response) => {
  res.status(200).json({ data: getReferenceChart() });
});

router.get('/deviations', (_req: Request, res: Response) => {
  res.status(200).json({ data: ILLUSTRIOUS_18 });
});

const countDrillQuerySchema = z.object({
  cards: z.coerce.number().int().min(4).max(80).default(20),
  decksRemaining: z.coerce.number().int().min(1).max(8).default(4),
});

router.get('/count-drill', (req: Request, res: Response) => {
  const { cards, decksRemaining } = parseQuery(countDrillQuerySchema, req.query);
  res.status(200).json({ data: generateCountDrill(cards, decksRemaining) });
});

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
