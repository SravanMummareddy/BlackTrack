import { Router } from 'express';
import { checkDatabaseConnection } from '../database/schema';
import authRouter from './auth';
import sessionsRouter from './sessions';
import handsRouter from './hands';
import usersRouter from './users';
import strategyRouter from './strategy';

export const apiRouter = Router();

// Health check — no auth required
apiRouter.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseConnection();

  const status = dbHealthy ? 'ok' : 'error';
  res.status(dbHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
    checks: {
      database: { status: dbHealthy ? 'ok' : 'error' },
    },
  });
});

apiRouter.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/sessions/:sessionId/hands', handsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/strategy', strategyRouter);
