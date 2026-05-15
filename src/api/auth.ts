import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import * as authService from '../services/auth-service';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import { schemas } from '../utils/validation';

const router = Router();

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later.' } },
});

router.use(authLimiter);

const registerSchema = z.object({
  email: schemas.email,
  name: schemas.name,
  password: schemas.password,
});

const loginSchema = z.object({
  email: schemas.email,
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = parseBody(registerSchema, req.body);
  const tokens = await authService.register(email, name, password);
  res.status(201).json({ data: tokens });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = parseBody(loginSchema, req.body);
  const tokens = await authService.login(email, password);
  res.status(200).json({ data: tokens });
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = parseBody(refreshSchema, req.body);
  const tokens = await authService.refreshTokens(refreshToken);
  res.status(200).json({ data: tokens });
}));

router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.userId!);
  res.status(204).send();
}));

export default router;
