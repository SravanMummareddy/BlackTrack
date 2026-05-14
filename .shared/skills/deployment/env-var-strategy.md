# Environment Variable Strategy

---

## Safe to Commit vs Never Commit

| Variable Type | Example | Commit? |
|---|---|---|
| Non-secret config | `NODE_ENV`, `PORT`, `LOG_LEVEL` | Yes (in `.env.example`) |
| Public URLs | `NEXT_PUBLIC_APP_URL` | Yes (in `.env.example`) |
| Feature flags | `FEATURE_NEW_DASHBOARD=true` | Yes |
| Database URLs | `DATABASE_URL` | **No** — use placeholder |
| Secrets / API keys | `JWT_SECRET`, `STRIPE_KEY` | **Never** |
| OAuth credentials | `GOOGLE_CLIENT_SECRET` | **Never** |

---

## .env.example Format

```bash
# .env.example — commit this file, NOT .env.local
# Copy to .env.local and fill in real values

# --- Application ---
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# --- Database ---
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:[PASSWORD]@localhost:5432/[PROJECT_NAME]_dev

# --- Redis ---
REDIS_URL=redis://localhost:6379

# --- Authentication ---
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=[GENERATE_RANDOM_64_BYTES]
JWT_REFRESH_SECRET=[GENERATE_RANDOM_64_BYTES]

# --- OAuth (optional) ---
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]
OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/oauth/callback

# --- Frontend ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Environment-Specific Configs

| File | Purpose | Committed |
|---|---|---|
| `.env.example` | Template with placeholders | Yes |
| `.env.local` | Local dev values | No |
| `.env.test` | Test environment values | Yes (no real secrets) |
| `.env.production` | Prod values | No — use secret manager |

### .env.test (safe to commit — no real secrets)
```bash
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/testdb
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret-not-for-production
JWT_REFRESH_SECRET=test-refresh-secret-not-for-production
```

---

## Validation on Startup

Fail fast if required env vars are missing:

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

---

## Best Practices

- Never access `process.env` directly in application code — use `env` from the validated config.
- Use `NEXT_PUBLIC_` prefix only for values safe to expose to the browser.
- Rotate secrets by adding a new variable, deploying, then removing the old one.
- Use a secret manager (AWS Secrets Manager, Vault) for production — inject at deploy time.
- Document every variable in `.env.example` with a comment.
