# Database Documentation — [PROJECT_NAME]

---

## Schema Overview

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User accounts | `id`, `email`, `role`, `active` |
| `refresh_tokens` | JWT refresh tokens | `user_id`, `token_hash`, `expires_at` |
| `posts` | Example domain table | `author_id`, `status`, `published_at` |

Full schema: `.shared/schemas/database-schema.sql`
Prisma schema: `prisma/schema.prisma`

---

## Table Relationships

```
users (1) ──── (many) refresh_tokens
users (1) ──── (many) posts
```

All foreign keys have `ON DELETE CASCADE` — deleting a user removes their tokens and posts.

---

## Migration Strategy

### Development
```sh
# Create a migration from schema changes
bun run db:migrate -- --name describe_what_changed

# Apply without creating a new migration (reset dev DB)
bun run db:migrate -- reset
```

### Staging / Production
```sh
# Apply pending migrations only (no schema changes)
bun run db:migrate:deploy
```

### Rules
1. Never edit existing migration files — create new ones.
2. Always test migrations on a copy of production data before applying to prod.
3. Every destructive migration (DROP, column removal) needs a corresponding rollback plan.
4. Migration names: `describe_what_changed` (lowercase, underscores)

---

## Backup Strategy

### Development
Not required — use `bunx prisma migrate reset` to rebuild.

### Production
- Automated daily snapshots via PostgreSQL's `pg_dump` or cloud provider snapshots.
- Retain backups for 30 days.
- Test restore procedure monthly.
- Point-in-time recovery via WAL archiving for critical data.

```sh
# Manual backup
pg_dump $DATABASE_URL -Fc -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -d $DATABASE_URL backup_20240115.dump
```

---

## Performance Considerations

### Indexes

All indexes are defined in `.shared/schemas/database-schema.sql`. Key ones:

- `users.email` — unique, used for login lookups
- `posts(author_id, status, created_at DESC)` — composite for the most common query pattern
- Partial index on `users(email) WHERE deleted_at IS NULL` for soft-delete patterns

### Connection Pooling

See `.shared/skills/database-patterns/connection-pooling.md`.

Default: `connection_limit=10` per app instance.

### Query Performance

Run EXPLAIN ANALYZE for any query taking > 100ms:
```sql
EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = 'abc' ORDER BY created_at DESC LIMIT 20;
```

Slow query log: set `log_min_duration_statement = 500` in PostgreSQL config.

---

## Common Queries

```typescript
// Get user with post count
const user = await prisma.user.findUnique({
  where: { id },
  include: { _count: { select: { posts: true } } },
});

// Get published posts for a user, newest first, paginated
const posts = await prisma.post.findMany({
  where: { authorId: userId, status: 'PUBLISHED' },
  orderBy: { createdAt: 'desc' },
  take: pageSize,
  skip: (page - 1) * pageSize,
  select: { id: true, title: true, publishedAt: true },
});

// Soft delete (if using deletedAt pattern)
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```
