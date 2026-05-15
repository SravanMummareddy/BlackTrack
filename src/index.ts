import { app } from './app';
import { logger } from './utils/logger';
import { prisma } from './database';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

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
