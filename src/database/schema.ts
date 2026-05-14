import { prisma } from './index';
import { logger } from '../utils/logger';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getDatabaseVersion(): Promise<string> {
  const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
  return result[0].version;
}

export async function runMigrationStatus(): Promise<void> {
  try {
    const result = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null }>>`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 5
    `;
    logger.info('Recent migrations', { migrations: result });
  } catch {
    logger.warn('Could not read migration status — _prisma_migrations table may not exist yet');
  }
}
