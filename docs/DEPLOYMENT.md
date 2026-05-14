# Deployment Guide — [PROJECT_NAME]

---

## Environments

| Environment | Branch / Trigger | URL | DB |
|---|---|---|---|
| Development | Local | `localhost:3000` | Local Docker |
| Staging | Push to `staging` | `staging.example.com` | Staging DB |
| Production | Tag `v*.*.*` on `main` | `app.example.com` | Production DB |

---

## Environment Setup

### Local Development

1. Install dependencies
```sh
bun install
bun run db:generate
```

2. Copy and configure environment
```sh
cp config/.env.example .env.local
# Edit .env.local with your local values
```

3. Start infrastructure
```sh
docker compose -f docker/docker-compose.yml up -d postgres redis
```

4. Run database migrations
```sh
bun run db:migrate
```

5. Start the app
```sh
bun run dev
```

Or use the convenience script: `./scripts/dev.sh`

---

### Staging Setup

Environment variables are injected via CI/CD secrets (GitHub Actions / Railway / Render).

Required secrets:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Deployment steps (automated on push to `staging`):
1. Build Docker image
2. Run `bun run db:migrate:deploy`
3. Deploy new image
4. Health check: `GET /api/health`

---

### Production Setup

Same as staging. Additional requirements:
- Manual approval gate before migrations
- Database backup before any migration
- Blue/green or rolling deployment to avoid downtime

---

## Secrets Management

Never commit secrets to git. Use:
- **Local**: `.env.local` (gitignored)
- **Staging/Prod**: CI/CD secret manager (GitHub Secrets, Railway, AWS Secrets Manager)

To rotate a secret:
1. Add the new value to the secret manager
2. Update the app to accept both old and new (if needed for rotation window)
3. Deploy
4. Remove the old value

---

## Database Migrations on Deploy

```sh
# Always run before starting the new app version
bun run db:migrate:deploy
```

This is safe to run multiple times — Prisma tracks which migrations have been applied.

For destructive migrations (table drops, column removals):
1. Deploy code that works with both old and new schema
2. Run migration
3. Deploy code that uses new schema only

---

## Rollback Procedure

### Application Rollback
Re-deploy the previous Docker image version.

### Database Rollback
Prisma does not have automatic rollback. Options:
1. Apply the inverse migration manually (e.g., re-add dropped column)
2. Restore from the pre-migration backup

This is why: **always back up before migrations** and **write reversible migrations**.

---

## Health Check

After every deployment, verify:
```sh
curl https://your-domain.com/api/health
```

Expected response: `{ "status": "ok", ... }`

If status is `error`, check logs and rollback if needed.

---

## Docker Build and Deploy

```sh
# Build production image
docker build -t [project-name]:latest .

# Run locally to test
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e JWT_SECRET=... \
  [project-name]:latest
```

See `docker/Dockerfile` for the multi-stage build configuration.
