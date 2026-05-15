import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as sessionService from '../services/session-service';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import { schemas } from '../utils/validation';

const router = Router();

const centsField = z.number().int().min(0);
const moodField = z.number().int().min(1).max(5);
const tagField = z
  .string()
  .trim()
  .min(1, 'Tags cannot be empty')
  .max(32, 'Tags must be 32 characters or fewer')
  .regex(/^[a-z0-9][a-z0-9 -]*$/i, 'Tags can only include letters, numbers, spaces, and hyphens')
  .transform((tag) => tag.toLowerCase());
const tagsField = z
  .array(tagField)
  .max(8, 'Use 8 tags or fewer')
  .transform((tags) => Array.from(new Set(tags)));

const createSchema = z.object({
  casinoName: z.string().min(1, 'Casino name is required').trim(),
  tableMin: centsField,
  tableMax: centsField,
  decks: z.number().int().positive().optional(),
  buyIn: centsField,
  notes: z.string().trim().max(2000).optional(),
  tags: tagsField.optional(),
  moodStart: moodField.optional(),
}).refine(d => d.tableMax >= d.tableMin, {
  message: 'tableMax must be >= tableMin',
  path: ['tableMax'],
});

const updateSchema = z.object({
  casinoName: z.string().min(1).trim().optional(),
  notes: z.string().trim().max(2000).optional(),
  cashOut: centsField.optional(),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
  tags: tagsField.optional(),
  moodEnd: moodField.optional(),
  completionNotes: z.string().trim().max(2000).optional(),
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

router.post('/', async (req: Request, res: Response) => {
  const input = parseBody(createSchema, req.body);
  const session = await sessionService.createSession(req.userId!, input);
  res.status(201).json({ data: session });
});

router.get('/', async (req: Request, res: Response) => {
  const pagination = parseQuery(schemas.pagination, req.query);
  const result = await sessionService.listSessions(req.userId!, pagination.page ?? 1, pagination.pageSize ?? 20);
  res.status(200).json(result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const session = await sessionService.getSession(req.userId!, req.params.id);
  res.status(200).json({ data: session });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const input = parseBody(updateSchema, req.body);
  const session = await sessionService.updateSession(req.userId!, req.params.id, input);
  res.status(200).json({ data: session });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await sessionService.deleteSession(req.userId!, req.params.id);
  res.status(204).send();
});

export default router;
