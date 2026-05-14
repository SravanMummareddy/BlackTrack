# Style Guide — [PROJECT_NAME]

---

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `user-service.ts`, `auth-middleware.ts` |
| Directories | `kebab-case` | `src/user-profile/` |
| Functions | `camelCase` | `getUserById()`, `hashPassword()` |
| Variables | `camelCase` | `userCount`, `isAuthenticated` |
| Classes | `PascalCase` | `UserService`, `AppError` |
| Types/Interfaces | `PascalCase` | `UserProfile`, `AuthToken` |
| Enums | `PascalCase` (members `UPPER_SNAKE`) | `UserRole.ADMIN` |
| Constants | `UPPER_SNAKE_CASE` | `JWT_SECRET`, `MAX_PAGE_SIZE` |
| Database tables | `snake_case` (plural) | `users`, `refresh_tokens` |
| Database columns | `snake_case` | `created_at`, `user_id` |
| API routes | `kebab-case` (plural nouns) | `/api/users`, `/api/refresh-tokens` |
| Environment vars | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `NODE_ENV` |

---

## Code Structure

### File Layout
```typescript
// 1. Node built-in imports
import { randomBytes } from 'crypto';

// 2. Third-party imports
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// 3. Internal imports (use @ alias)
import { prisma } from '@/database';
import { logger } from '@/utils/logger';

// 4. Type-only imports
import type { User } from '@/types';

// 5. Constants
const MAX_RETRIES = 3;

// 6. Main code
export class UserService { ... }

// 7. Helper functions (if needed, not exported)
function buildCacheKey(id: string) { ... }
```

### Function Length
- Target: under 30 lines per function
- Hard limit: 50 lines — if longer, extract helpers
- One responsibility per function

### Export Style
- Prefer named exports: `export function foo()`
- Use default exports only for Next.js pages/components
- Re-export from `index.ts` for clean import paths

---

## Comment Style

**Write comments only when the WHY is non-obvious.**

```typescript
// Good — explains a non-obvious constraint
// Skip bcrypt in test helpers — hashing is slow and we're not testing it
passwordHash: '$2b$10$fakehash'

// Bad — describes what the code already says
// Check if user exists
const user = await prisma.user.findUnique({ where: { id } });

// Good — workaround explanation
// Prisma doesn't support SKIP LOCKED directly; use $queryRaw for queue-safe polling
const job = await prisma.$queryRaw`SELECT * FROM jobs WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED`;
```

---

## Error Handling

### Rules

1. All async functions must propagate or handle errors — never swallow silently.
2. Use custom error classes from `src/utils/errors.ts`.
3. Always log with context before re-throwing or returning an error response.
4. Never expose internal error messages (DB errors, stack traces) to clients.

### Pattern
```typescript
async function getUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}
```

Route handlers don't need try/catch — the global error handler catches all throws:
```typescript
router.get('/users/:id', authenticate, async (req, res) => {
  const user = await userService.getUser(req.params.id); // throws NotFoundError if missing
  res.json({ data: user });
});
```

---

## Common Patterns to Follow

### Structured response shape
```typescript
// Success
res.json({ data: result });
res.json({ data: result, pagination: { ... } });

// Error (handled by error-handler middleware)
throw new NotFoundError('Post');
```

### Environment config access
```typescript
// Always use the validated env object
import { env } from '@/config/env';
const port = env.PORT; // not process.env.PORT
```

### Prisma include vs select
```typescript
// Use select when you don't need all fields (common in list endpoints)
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// Use include for related data
const post = await prisma.post.findUnique({
  where: { id },
  include: { author: { select: { id: true, name: true } } },
});
```
