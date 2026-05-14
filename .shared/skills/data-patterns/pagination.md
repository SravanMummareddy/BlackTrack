# Pagination Patterns

---

## Offset vs Cursor-Based

| | Offset | Cursor |
|---|---|---|
| Simplicity | Simple | More complex |
| Performance on large sets | Degrades (OFFSET scans) | Consistent |
| Stable results during updates | No (rows shift) | Yes |
| Random page access | Yes | No |
| Use when | < 10k rows, admin UIs | Feeds, infinite scroll, large data |

---

## Offset Pagination

### SQL
```sql
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- Total count (separate query)
SELECT COUNT(*) FROM posts;
```

### Prisma Implementation
```typescript
export async function getPaginatedPosts(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await prisma.$transaction([
    prisma.post.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count(),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: skip + pageSize < total,
      hasPrev: page > 1,
    },
  };
}
```

---

## Cursor-Based Pagination

### SQL
```sql
-- First page
SELECT * FROM posts
WHERE created_at < NOW()
ORDER BY created_at DESC
LIMIT $1;

-- Next page (cursor = last item's created_at)
SELECT * FROM posts
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT $1;
```

### Prisma Implementation
```typescript
export async function getCursorPaginatedPosts(
  cursor: string | undefined,
  limit: number
) {
  const items = await prisma.post.findMany({
    take: limit + 1, // fetch one extra to determine hasNextPage
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // skip the cursor item itself
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, -1) : items;
  const nextCursor = hasNextPage ? data[data.length - 1].id : undefined;

  return { items: data, nextCursor, hasNextPage };
}
```

---

## React Hook (Cursor-Based)

```typescript
import { useState } from 'react';

export function usePaginatedPosts(limit = 20) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<Post[]>([]);

  const fetchMore = async () => {
    const { items, nextCursor } = await fetch(
      `/api/posts?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`
    ).then((r) => r.json());

    setAllItems((prev) => [...prev, ...items]);
    setCursor(nextCursor);
  };

  return { allItems, fetchMore };
}
```

---

## Constraints and Best Practices

- Always paginate — never return unbounded lists.
- Default `pageSize`/`limit` to 20; cap at 100.
- Use cursor pagination for any list that may exceed 10k rows.
- Ensure the cursor column is indexed (usually `id` or `createdAt`).
- Return `nextCursor` as an opaque string (base64-encode composite cursors).
- Include `hasNextPage` so clients know when to stop fetching.
