# Error Handling Patterns

---

## Standard Error Response Format

All error responses must follow this JSON shape:

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

- `code`: machine-readable constant (uppercase snake_case)
- `message`: human-readable summary
- `details`: optional array for field-level errors

---

## HTTP Status Code Map

| Code | Meaning | Error Constant |
|---|---|---|
| 400 | Validation failed / bad request | `VALIDATION_ERROR` |
| 401 | Not authenticated | `UNAUTHORIZED` |
| 403 | Authenticated but not allowed | `FORBIDDEN` |
| 404 | Resource not found | `NOT_FOUND` |
| 409 | Conflict (duplicate, stale) | `CONFLICT` |
| 422 | Unprocessable entity | `UNPROCESSABLE` |
| 429 | Rate limit exceeded | `RATE_LIMIT_EXCEEDED` |
| 500 | Internal server error | `INTERNAL_ERROR` |

---

## Custom Error Classes

```typescript
// src/utils/errors.ts

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(details: Array<{ field?: string; message: string }>) {
    super(400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}
```

---

## Global Error Handler Middleware

```typescript
// src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    // Expected errors — log at warn level
    logger.warn('Application error', {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unexpected errors — log full stack at error level
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
```

---

## Logging Strategy

- **Expected errors (4xx)**: log at `warn` level with request context.
- **Unexpected errors (5xx)**: log at `error` level with full stack trace.
- **Never log**: passwords, tokens, credit card numbers, PII beyond user ID.
- Always include: `requestId`, `userId` (if available), `path`, `method`.

---

## Client vs Server Errors

- **Client errors (4xx)**: the caller did something wrong. Give a clear, actionable message.
- **Server errors (5xx)**: we did something wrong. Return a generic message; log the details internally.
- Never expose internal error messages, stack traces, or DB errors to clients.
