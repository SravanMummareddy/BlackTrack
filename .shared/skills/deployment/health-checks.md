# Health Check Patterns

---

## Health Endpoint Implementation

```typescript
// src/api/health.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { redis } from '../database/redis';

export const healthRouter = Router();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }>;
}

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const checks: HealthStatus['checks'] = {};
  let overallStatus: HealthStatus['status'] = 'ok';

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'error', error: 'Database unreachable' };
    overallStatus = 'error';
  }

  // Redis check
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
  } catch {
    checks.redis = { status: 'error', error: 'Redis unreachable' };
    // Redis failure is degraded, not full error (depends on your use case)
    if (overallStatus === 'ok') overallStatus = 'degraded';
  }

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
    checks,
  };

  // Use 200 for ok/degraded, 503 for error
  const httpStatus = overallStatus === 'error' ? 503 : 200;
  res.status(httpStatus).json(body);
});

// Lightweight liveness check (no dependency checks)
healthRouter.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness check (is the app ready to serve traffic?)
healthRouter.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', reason: 'Database not ready' });
  }
});
```

---

## Response Format

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.2.3",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "redis": { "status": "ok", "latencyMs": 3 }
  }
}
```

Degraded example:
```json
{
  "status": "degraded",
  "checks": {
    "database": { "status": "ok", "latencyMs": 15 },
    "redis": { "status": "error", "error": "Redis unreachable" }
  }
}
```

---

## Kubernetes-Ready Format

Kubernetes uses two separate probes:

| Probe | Endpoint | Purpose |
|---|---|---|
| Liveness | `GET /health/live` | Restart if unhealthy |
| Readiness | `GET /health/ready` | Remove from load balancer if not ready |
| Startup | `GET /health/live` | Delay liveness checks during boot |

```yaml
# kubernetes deployment spec
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /health/live
    port: 3000
  failureThreshold: 30
  periodSeconds: 5
```

---

## Best Practices

- Always exclude `/api/health` from authentication middleware.
- Exclude `/api/health` from rate limiting.
- Keep the liveness check fast — no DB queries.
- Cap health check timeout at 5s to prevent cascading slow probes.
- Never expose sensitive info in health responses (no stack traces, no env values).
