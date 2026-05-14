# Runbook — [PROJECT_NAME]

Common issues, fixes, and debugging procedures.

---

## Common Issues

### App won't start

**Symptom**: App crashes immediately on startup.

**Steps**:
1. Check for missing env vars: `bun run start 2>&1 | grep "Invalid environment"`
2. Verify DATABASE_URL is reachable: `psql $DATABASE_URL -c "SELECT 1"`
3. Verify Redis is reachable: `redis-cli -u $REDIS_URL ping`
4. Check for TypeScript errors: `npm run build`
5. Check for unapplied migrations: `npx prisma migrate status`

---

### Database connection errors

**Symptom**: `Error: Can't reach database server` or `connection refused`.

**Steps**:
1. Verify PostgreSQL is running: `docker compose ps` (local) or check cloud console
2. Check connection string format: `postgresql://USER:PASS@HOST:PORT/DB`
3. Check `connection_limit` — if pool is exhausted, check `pg_stat_activity`
4. Check firewall rules (production: is app server IP whitelisted?)

```sql
-- Check active connections
SELECT count(*), state FROM pg_stat_activity WHERE datname = '[db_name]' GROUP BY state;

-- Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';
```

---

### Redis connection errors

**Symptom**: `Error: connect ECONNREFUSED` for Redis.

**Steps**:
1. Verify Redis is running: `docker ps | grep redis` or `redis-cli ping`
2. Check REDIS_URL format: `redis://HOST:PORT`
3. The app is designed to degrade gracefully on Redis failure — check if caching is just disabled

---

### High error rate (5xx)

**Steps**:
1. Check application logs: `docker logs [container] --tail=100`
2. Check database health: `GET /api/health`
3. Look for repeated error messages and find the root cause
4. Check for recent deployments or migrations

---

### Slow API responses

**Steps**:
1. Check `/api/health` for database latency
2. Enable slow query logging in PostgreSQL (set `log_min_duration_statement = 200`)
3. Use `EXPLAIN ANALYZE` on the slow query
4. Check Redis hit rates — if cache is cold after a deploy, queries will spike
5. Check for N+1 queries using Prisma query logging:
```typescript
new PrismaClient({ log: ['query'] })
```

---

### JWT token errors

**Symptom**: `401 UNAUTHORIZED` on valid-looking requests.

**Steps**:
1. Verify token hasn't expired (access tokens: 15 min)
2. Verify JWT_SECRET matches between token generation and verification
3. Check system clock — JWT validation is time-sensitive
4. Verify Authorization header format: `Bearer <token>` (not `bearer` or without space)

---

## Debugging Strategies

### Logging

Logs are structured JSON. Filter by level:
```sh
# Production (if using a log aggregator)
# Filter: level=error OR level=warn

# Local
npm run dev 2>&1 | jq 'select(.level == "error")'
```

Key log fields:
- `level`: debug, info, warn, error
- `msg`: human-readable message
- `requestId`: trace a request through the system
- `userId`: identify which user triggered the issue
- `err.message` / `err.stack`: error details

### Request Tracing

Every request gets a `requestId` (UUID) assigned in middleware.
Search logs by requestId to trace the full lifecycle of a request.

### Log Locations

| Environment | Location |
|---|---|
| Local Docker | `docker logs [container-name]` |
| Production | Cloud provider log service (Datadog, CloudWatch, etc.) |

---

## Performance Issues

### High CPU

1. Look for inefficient loops or missing indexes
2. Profile with: `node --prof dist/index.js` → `node --prof-process isolate-*`
3. Common cause: synchronous crypto (bcrypt) on the main thread for bulk operations

### High Memory

1. Check for unclosed database connections: `pg_stat_activity`
2. Look for large in-memory arrays (fetching unbounded lists)
3. Restart the instance as a short-term fix while investigating

### High Database Load

1. Check `pg_stat_activity` for long-running queries
2. Look at `pg_stat_statements` for the most expensive queries
3. Add missing indexes (see `docs/DATABASE.md`)
4. Enable connection pooling at the infrastructure level (PgBouncer)
