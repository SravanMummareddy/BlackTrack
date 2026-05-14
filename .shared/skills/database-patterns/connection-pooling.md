# Connection Pooling

---

## PostgreSQL Connection Limits

Each PostgreSQL connection costs ~5-10MB of RAM. Default `max_connections` is 100.
With multiple app instances, connections multiply — use a pool to share and cap them.

---

## Prisma Pool Configuration

### Via DATABASE_URL
```
postgresql://user:password@host:5432/dbname?connection_limit=10&pool_timeout=20
```

Parameters:
- `connection_limit`: max connections per Prisma instance (default: `num_cpus * 2 + 1`)
- `pool_timeout`: seconds to wait for a free connection before erroring (default: 10)
- `connect_timeout`: seconds to wait for initial connection (default: 5)

### Via PrismaClient Constructor
```typescript
// src/database/pool.ts
import { PrismaClient } from '@prisma/client';

const connectionLimit = parseInt(process.env.DB_POOL_MAX ?? '10');

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});
```

### Recommended Settings by Environment

| Environment | connection_limit | pool_timeout |
|---|---|---|
| Development (single instance) | 5 | 10 |
| Staging | 10 | 15 |
| Production (per pod) | 10–20 | 20 |

> **Rule of thumb**: `total_connections = num_app_pods × connection_limit < pg_max_connections × 0.8`

---

## Singleton Pattern (avoid multiple PrismaClient instances)

```typescript
// src/database/index.ts
import { PrismaClient } from '@prisma/client';

// In Next.js / hot-reload environments, prevent multiple instances
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Graceful Shutdown

```typescript
// Always disconnect on process exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## Monitoring Connections

```sql
-- Active connections per database
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Connection details
SELECT pid, usename, application_name, state, wait_event_type, query_start
FROM pg_stat_activity
WHERE datname = 'your_db';
```

---

## Best Practices

- Use a single PrismaClient instance per process.
- Use PgBouncer in front of PostgreSQL in high-scale production deployments.
- Set `connection_limit` conservatively — too many idle connections wastes PG memory.
- Monitor `pg_stat_activity` for long-running or idle connections.
- Always call `prisma.$disconnect()` on shutdown.
