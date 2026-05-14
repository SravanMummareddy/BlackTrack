# Rate Limiting Patterns

---

## Strategies

| Strategy | Description | Use Case |
|---|---|---|
| Fixed window | Count requests per time window | Simple global limits |
| Sliding window | Rolling count over past N seconds | Smoother, prevents burst at boundary |
| Token bucket | Refill tokens over time; burst allowed | APIs with burst tolerance |
| Leaky bucket | Constant drain rate; queue excess | Strict throughput control |

**Default recommendation**: sliding window with Redis for per-user limits.

---

## Express Middleware (Redis-backed sliding window)

```typescript
// src/middleware/rate-limiter.ts
import { Request, Response, NextFunction } from 'express';
import { redis } from '../database/redis';
import { TooManyRequestsError } from '../utils/errors';

interface RateLimitOptions {
  windowMs: number;  // milliseconds
  max: number;       // max requests per window
  keyFn?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyFn } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const key = keyFn
      ? keyFn(req)
      : `rl:${req.ip}:${req.path}`;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries, add current timestamp, count
    await redis.zRemRangeByScore(key, '-inf', windowStart);
    await redis.zAdd(key, { score: now, value: `${now}` });
    await redis.expire(key, windowSec);
    const count = await redis.zCard(key);

    if (count > max) {
      throw new TooManyRequestsError(`Rate limit exceeded: ${max} requests per ${windowSec}s`);
    }

    next();
  };
}
```

### Configuration Examples

```typescript
// Global: 100 req/min per IP
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Auth endpoints: 5 attempts/15 min per IP
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, max: 5 }));

// Per-user API: 1000 req/min
app.use('/api/', rateLimit({
  windowMs: 60_000,
  max: 1000,
  keyFn: (req) => `rl:user:${req.user?.id}`,
}));
```

---

## Response Headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)

```typescript
// Add to rate limiter middleware after counting:
res.setHeader('X-RateLimit-Limit', max);
res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
```

---

## Testing Approach

```typescript
describe('rate limiter', () => {
  it('allows requests within limit', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/api/test');
      expect(res.status).not.toBe(429);
    }
  });

  it('blocks requests over limit', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app).get('/api/test');
    }
    const res = await request(app).get('/api/test');
    expect(res.status).toBe(429);
  });

  afterEach(async () => {
    // Clear rate limit keys between tests
    const keys = await redis.keys('rl:*');
    if (keys.length) await redis.del(...keys);
  });
});
```

---

## Best Practices

- Store rate limit state in Redis, not in-process memory (stateless app servers).
- Use consistent `keyFn` — IP-based for unauthenticated, user-ID-based for authenticated.
- Always return `Retry-After` header on 429 responses.
- Exempt health check endpoints from rate limiting.
- Make limits configurable via environment variables, not hardcoded.
