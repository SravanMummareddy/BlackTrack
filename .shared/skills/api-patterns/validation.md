# Input Validation Patterns

---

## Strategy

- Validate at the API boundary — before any business logic runs.
- Use **Zod** for schema definition and parsing.
- Return field-level error details on failure (see error-handling.md).
- Never trust client input, including from authenticated users.

---

## Zod Setup

```typescript
// Install: npm install zod
import { z } from 'zod';
```

### Common Zod Patterns

```typescript
// Reusable primitives
const emailSchema = z.string().email('Invalid email format').toLowerCase();
const passwordSchema = z.string().min(8, 'Must be at least 8 characters');
const uuidSchema = z.string().uuid('Invalid ID format');
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Request body schema
const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100).trim(),
});

// Infer TypeScript type from schema
type CreateUserInput = z.infer<typeof createUserSchema>;
```

---

## Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export function validate(schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError(details);
    }

    // Replace raw input with parsed (coerced, stripped) values
    req[target] = result.data;
    next();
  };
}
```

### Usage in Routes

```typescript
router.post(
  '/users',
  validate(createUserSchema, 'body'),
  async (req: Request, res: Response) => {
    const input = req.body as CreateUserInput; // safe to use directly
    const user = await userService.create(input);
    res.status(201).json({ data: user });
  }
);

router.get(
  '/users',
  validate(paginationSchema, 'query'),
  async (req: Request, res: Response) => {
    const { page, pageSize } = req.query as z.infer<typeof paginationSchema>;
    const result = await userService.list({ page, pageSize });
    res.json({ data: result });
  }
);
```

---

## Error Response Example

When validation fails:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  }
}
```

---

## Common Validators

```typescript
// src/utils/validation.ts

export const validators = {
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Must contain uppercase, lowercase, and number'
  ),
  uuid: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  url: z.string().url(),
  isoDate: z.string().datetime(),
  positiveInt: z.number().int().positive(),
};
```

---

## Best Practices

- Define schemas once; reuse across routes and tests.
- Use `z.coerce` for query parameters (they arrive as strings).
- Use `.transform()` to normalize input (trim, lowercase emails).
- Use `.strip()` (default) to remove unknown fields from parsed output.
- Keep schemas co-located with their handler or in a `*.schema.ts` file.
