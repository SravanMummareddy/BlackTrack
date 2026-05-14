/**
 * Connection pool configuration reference.
 * Actual pool is configured via DATABASE_URL query parameters.
 *
 * Format: postgresql://user:pass@host:port/db?connection_limit=10&pool_timeout=20
 *
 * See .shared/skills/database-patterns/connection-pooling.md for tuning guidance.
 */

export const POOL_CONFIG = {
  development: {
    connectionLimit: 5,
    poolTimeout: 10,
  },
  test: {
    connectionLimit: 3,
    poolTimeout: 5,
  },
  production: {
    connectionLimit: 10,
    poolTimeout: 20,
  },
} as const;

export function buildDatabaseUrl(baseUrl: string): string {
  const env = (process.env.NODE_ENV as keyof typeof POOL_CONFIG) ?? 'development';
  const config = POOL_CONFIG[env] ?? POOL_CONFIG.development;

  const url = new URL(baseUrl);
  url.searchParams.set('connection_limit', String(config.connectionLimit));
  url.searchParams.set('pool_timeout', String(config.poolTimeout));
  return url.toString();
}
