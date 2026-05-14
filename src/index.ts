import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { apiRouter } from './api';
import { requestId, requestLogger, errorHandler } from './middleware';
import { logger } from './utils/logger';
import { prisma } from './database';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Middleware — order matters
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestId);
app.use(requestLogger);

// Routes
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir));
app.use('/api/v1', apiRouter);
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  res.sendFile(path.join(publicDir, 'index.html'));
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler — must be last
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received — shutting down`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server (not in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server started`, { port: PORT, env: process.env.NODE_ENV });
  });
}

export { app };
