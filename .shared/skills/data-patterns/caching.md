# Caching Patterns

---

## When to Cache

Cache when:
- Data is read far more often than it changes (read:write ratio > 10:1)
- The computation or DB query is expensive (> 50ms)
- The data can tolerate slight staleness (user profiles, config, counts)

Do NOT cache:
- Highly personalized data with security implications
- Data that must always be real-time (balances, inventory)
- Data that changes on every request

---

## Redis Patterns

### Basic Get/Set with TTL
```typescript
import { redis } from '../database/redis';

const CACHE_TTL = 60 * 5; // 5 minutes in seconds

export async function getCachedUser(userId: string) {
  const cacheKey = `user:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(user));

  return user;
}
```

### Cache Aside Pattern (recommended default)
```typescript
async function cacheAside<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage
const posts = await cacheAside(
  `user:${userId}:posts`,
  300,
  () => prisma.post.findMany({ where: { authorId: userId } })
);
```

### Redis Client Setup
```typescript
// src/database/redis.ts
import { createClient } from 'redis';

export const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (err) => logger.error('Redis error', { err }));
await redis.connect();
```

---

## Cache Invalidation Strategies

### 1. TTL-based (simplest)
Set a TTL and let it expire naturally. Good when slight staleness is acceptable.

### 2. Write-through (strong consistency)
Update cache immediately when DB is updated:
```typescript
async function updateUser(userId: string, data: Partial<User>) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  await redis.setex(`user:${userId}`, CACHE_TTL, JSON.stringify(user));
  return user;
}
```

### 3. Invalidate on write (most common)
Delete the cache key when the underlying data changes:
```typescript
async function updateUser(userId: string, data: Partial<User>) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  await redis.del(`user:${userId}`);
  return user;
}
```

### 4. Tag-based invalidation
Group related cache keys with a tag and invalidate by tag:
```typescript
// Store set of keys per tag
await redis.sadd(`tag:user:${userId}`, cacheKey);

// Invalidate all keys for a user
const keys = await redis.smembers(`tag:user:${userId}`);
if (keys.length) await redis.del(...keys);
await redis.del(`tag:user:${userId}`);
```

---

## Best Practices

- Always serialize with `JSON.stringify` / `JSON.parse`.
- Use namespaced keys: `entity:id:subkey` (e.g., `user:123:posts`).
- Set reasonable TTLs — never cache indefinitely without a reason.
- Log cache hits/misses at debug level for observability.
- Handle Redis connection failures gracefully — fall back to DB, don't crash.
