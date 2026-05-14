# Deployment Guide — BlackStack

## Current Reality

BlackStack is primarily being run locally right now.

What is present in the repo:
- a Bun + Express application
- Prisma migrations
- a Dockerfile
- a Docker Compose file for local Postgres and Redis containers

What is not yet fully defined in the repo:
- a production hosting target
- CI/CD workflows
- staging environment automation
- production secret management conventions beyond general guidance

This document therefore focuses on the deploy shape that the current codebase actually supports.

## Local Development Deployment

Install dependencies:

```sh
bun install
```

Set environment values:

```sh
cp config/.env.example .env.local
```

Start local database:

```sh
docker compose -f docker/docker-compose.yml up -d postgres
```

Apply migrations:

```sh
bun run db:migrate
```

Seed strategy scenarios:

```sh
bun run seed:strategy
```

Run the app:

```sh
bun run dev
```

Primary local URLs:
- app: `http://localhost:3000/`
- API: `http://localhost:3000/api/v1`
- health: `http://localhost:3000/api/v1/health`

## Docker Notes

The repo includes:
- `docker/Dockerfile`
- `docker/docker-compose.yml`

Current compose services:
- `postgres`
- `redis`
- `app`

Important note:
- the current application code does not depend on Redis for core runtime behavior, even though Redis is still present in `docker-compose.yml`

## Environment Variables

Current required values for normal app operation:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Common optional or convenience values:
- `PORT`
- `NODE_ENV`
- `LOG_LEVEL`

## Migration Procedure

Development schema changes:

```sh
bun run db:migrate
```

Apply committed migrations in a deploy-like flow:

```sh
bun run db:migrate:deploy
```

Recommended order:
1. update code
2. apply migrations
3. seed strategy scenarios if scenario logic changed
4. start or restart the app
5. verify health

## Health Verification

Check health:

```sh
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/health/live
```

Expected liveness response:

```json
{ "status": "ok" }
```

## Production Planning Notes

If you deploy this app to a hosted environment later, keep these assumptions:
- Express serves both API and static web app
- PostgreSQL is required
- Prisma migrations must run before traffic flips
- seeded strategy data should exist before trainer use

Before calling production ready, add:
1. a defined hosting target
2. CI/CD workflows
3. environment-specific secrets handling
4. backup and rollback procedures
5. separate test and production databases

## Current Gaps

This repo does not yet define:
- branch-based deployment rules
- staging URLs
- production URLs
- automated rollback tooling
- infrastructure-as-code

Treat deployment as local-first until those pieces are deliberately added.
