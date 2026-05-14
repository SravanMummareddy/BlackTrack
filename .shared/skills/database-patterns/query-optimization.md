# Query Optimization Patterns

---

## N+1 Problem Detection

**N+1**: loading a list of N records, then querying DB once per record.

### Bad (N+1):
```typescript
const posts = await prisma.post.findMany();
// N additional queries:
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}
```

### Good (1 query with join):
```typescript
const posts = await prisma.post.findMany({
  include: { author: true },
});
```

### Good (2 queries, manual batch):
```typescript
const posts = await prisma.post.findMany();
const authorIds = [...new Set(posts.map((p) => p.authorId))];
const authors = await prisma.user.findMany({ where: { id: { in: authorIds } } });
const authorMap = new Map(authors.map((a) => [a.id, a]));
posts.forEach((p) => (p.author = authorMap.get(p.authorId)));
```

---

## Index Strategies

### Always index:
- Primary keys (automatic)
- Foreign keys: `CREATE INDEX idx_posts_author_id ON posts(author_id);`
- Columns in `WHERE` clauses used frequently
- Columns in `ORDER BY` on large tables
- Columns in `JOIN` conditions

### Composite indexes:
```sql
-- For queries like: WHERE user_id = ? AND created_at > ?
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
```

### Partial indexes (PostgreSQL-specific):
```sql
-- Only index active records (smaller, faster)
CREATE INDEX idx_users_active_email ON users(email) WHERE deleted_at IS NULL;
```

### Prisma schema indexes:
```prisma
model Post {
  id        String   @id
  authorId  String
  createdAt DateTime @default(now())

  @@index([authorId])
  @@index([authorId, createdAt(sort: Desc)])
}
```

---

## EXPLAIN ANALYZE Usage

```sql
-- See query plan and actual execution stats
EXPLAIN ANALYZE
SELECT * FROM posts WHERE author_id = 'abc' ORDER BY created_at DESC LIMIT 20;
```

Key things to look for:
- `Seq Scan` on large tables → needs an index
- `rows=10000` but `actual rows=1` → stale statistics, run `ANALYZE`
- High `cost` on nested loops → consider composite index
- `Sort` operations → add index with matching sort order

---

## Query Optimization Tips

### 1. Select only needed columns
```typescript
// Bad — selects everything including large text fields
const users = await prisma.user.findMany();

// Good
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});
```

### 2. Use `take` to limit results
```typescript
// Always paginate
const posts = await prisma.post.findMany({ take: 20, skip: offset });
```

### 3. Avoid `count` on large tables for every request
```typescript
// Cache counts or use approximate counts for non-critical UIs
const approxCount = await prisma.$queryRaw<[{ estimate: bigint }]>`
  SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'posts'
`;
```

### 4. Use `_count` aggregation instead of loading relations
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    _count: { select: { posts: true } }, // no N+1
  },
});
```

### 5. Avoid `findMany` + filter in JS — push filtering to DB
```typescript
// Bad
const allUsers = await prisma.user.findMany();
const active = allUsers.filter((u) => u.active);

// Good
const active = await prisma.user.findMany({ where: { active: true } });
```

---

## Monitoring Slow Queries

Enable in PostgreSQL (`postgresql.conf`):
```
log_min_duration_statement = 1000  # log queries taking > 1s
```

Or use `pg_stat_statements` extension:
```sql
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```
