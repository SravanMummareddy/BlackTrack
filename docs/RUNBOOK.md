# Runbook — BlackStack

This runbook covers the operational issues that match the current codebase.

## Common Commands

Start the app:

```sh
bun run dev
```

Run type checks:

```sh
bun run typecheck
```

Run integration tests:

```sh
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/appdb' \
JWT_SECRET='blackstack-test-access-secret' \
JWT_REFRESH_SECRET='blackstack-test-refresh-secret' \
LOG_LEVEL='error' \
bun test tests/integration/api.integration.test.ts --timeout 20000
```

Apply migrations:

```sh
bun run db:migrate
```

Seed strategy scenarios:

```sh
bun run seed:strategy
```

## If The App Will Not Start

Check these first:
1. confirm Postgres is running
2. confirm `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are set
3. confirm migrations are applied
4. run `bun run typecheck`

Useful checks:

```sh
docker compose -f docker/docker-compose.yml ps
bunx prisma migrate status
```

## If Health Check Fails

Test:

```sh
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/health/live
```

Interpretation:
- `/health/live` failing usually means the server is not up
- `/health` failing with `503` usually means the database connection check failed

## If Authentication Fails

Symptoms:
- `401 UNAUTHORIZED`
- refresh token rejected
- routes that worked before now fail immediately

Checks:
1. verify the `Authorization` header format is `Bearer <token>`
2. verify `JWT_SECRET` and `JWT_REFRESH_SECRET` are stable for the running server
3. verify the token is not expired
4. verify you are using an access token on protected routes and refresh token only for refresh

## If Session or Hand Routes Fail

Check:
1. the session belongs to the authenticated user
2. the session still exists
3. the session is still `ACTIVE` before logging a hand
4. money fields are being sent as integer cents

Common example mistakes:
- sending dollar values instead of cents
- trying to log a hand into a completed session
- forgetting `Authorization`

## If Strategy Routes Fail

Check:
1. strategy scenarios exist in the database
2. `bun run seed:strategy` has been run
3. the submitted `scenarioId` is valid
4. the submitted `action` matches the enum values

Valid actions:
- `HIT`
- `STAND`
- `DOUBLE`
- `SPLIT`
- `SURRENDER`

## Database Troubleshooting

If migrations are missing:

```sh
bunx prisma migrate status
bunx prisma migrate deploy
```

If Prisma says a table does not exist:
1. confirm the app is pointed at the intended database
2. apply migrations to that same database
3. rerun the failing command or test

If the integration suite fails after a clean checkout:
1. start local Postgres
2. run migrations
3. rerun the test command with explicit env vars

## Logging Notes

Current logging behavior:
- request logging is handled in middleware
- structured errors are logged through `src/utils/logger.ts`
- development logs are console-friendly
- non-development logs are JSON formatted

Useful signals in logs:
- `requestId`
- `path`
- `method`
- `userId`
- app error `code`

## Current Operational Limits

Things this runbook does not cover because the app does not implement them yet:
- Redis outages as a core dependency
- worker queues
- background jobs
- multi-service tracing
- production deployment rollback automation
