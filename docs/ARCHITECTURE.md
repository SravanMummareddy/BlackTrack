# Architecture — BlackStack

## Overview

BlackStack is a Bun + Express application with a server-rendered API and a static responsive web client.

There are two separate frontend surfaces in the repo:
- `design/` is reference-only and preserves prototype and visual exploration work
- `public/` is the real browser app served by Express

At runtime the app is currently a single service:
- serves static files from `public/`
- exposes JSON APIs under `/api/v1`
- persists data in PostgreSQL through Prisma

## Runtime Shape

```text
Browser
  -> GET /            static app from public/
  -> /api/v1/*        JSON API via Express

Express
  -> middleware       request ID, logging, auth, error handling
  -> route handlers   src/api/
  -> services         src/services/
  -> Prisma           PostgreSQL
```

## Current Product Areas

### Track

The live tracking workflow is blackjack-session based.

Current capabilities:
- create a casino session
- store table minimum and maximum in cents
- store buy-in and final cash-out in cents
- log individual blackjack hands inside a session
- compute session and user bankroll stats

### Learn

The live trainer is backed by seeded strategy scenarios plus runtime evaluation logic.

Current capabilities:
- fetch random strategy scenarios
- submit attempts
- compute user progress metrics
- render a reference chart in the web app

## Main Application Layers

### `src/index.ts`

Application entrypoint.

Responsibilities:
- create the Express app
- register middleware
- serve `public/`
- mount `/api/v1`
- provide SPA fallback for non-API routes
- wire graceful shutdown for Prisma

### `src/api/`

HTTP route layer only.

Current routers:
- `auth.ts`
- `sessions.ts`
- `hands.ts`
- `users.ts`
- `strategy.ts`

Responsibilities:
- parse and validate request input with Zod
- call service functions or direct Prisma reads where already implemented
- return JSON response envelopes
- rely on middleware for auth and errors

### `src/services/`

Business logic layer.

Current services:
- `auth-service.ts`
- `session-service.ts`
- `hand-service.ts`
- `strategy-service.ts`

Responsibilities:
- enforce business rules
- coordinate Prisma writes
- keep strategy seed data and runtime evaluation aligned

### `src/middleware/`

Current middleware:
- `requestId`
- `requestLogger`
- `authenticate`
- `optionalAuth`
- `errorHandler`

Notable current state:
- no Redis-backed rate limiter is implemented
- auth is bearer-token based
- handlers throw typed errors and let `errorHandler` format responses

### `src/database/`

Database utilities around Prisma.

Current responsibilities:
- Prisma singleton lifecycle
- simple health query helpers
- migration status helper

## Persistence Model

Core models in `prisma/schema.prisma`:
- `User`
- `CasinoSession`
- `Hand`
- `StrategyScenario`
- `StrategyAttempt`

Important design choices:
- money is stored as integer cents
- `CasinoSession` stores cached `handsPlayed` and `handsWon`
- `StrategyScenario` rows are seeded from the same tables used at runtime
- deleting a session cascades to hands

## Request Flow

Authenticated request flow:

```text
Client
  -> Express middleware
  -> authenticate
  -> route handler
  -> service / Prisma
  -> JSON response
```

Error flow:

```text
Throw AppError
  -> errorHandler
  -> { error: { code, message, details } }
```

Unexpected error flow:

```text
Throw Error
  -> errorHandler
  -> 500 INTERNAL_ERROR
  -> structured error log
```

## Frontend Architecture

The real app currently lives in:
- `public/index.html`
- `public/styles.css`
- `public/app.js`

This is a lightweight client-side app that:
- stores local UI state in memory
- calls the live backend directly
- renders dashboard, sessions, trainer, and profile views
- is intentionally separate from the prototype code in `design/`

## What Is Not In The Current Architecture

These ideas appear in older docs or prototypes but are not implemented as production architecture today:
- Next.js
- Redis-backed session or cache layers
- multi-game casino ledgers
- lessons, flashcards, quizzes, or mistakes queue
- responsible-gambling enforcement features
- CI/CD deployment automation inside the repo

## Near-Term Architecture Priorities

1. Expand integration coverage around the current API surface.
2. Keep `public/` as the production client while preserving `design/` as reference.
3. Add deeper analytics only after the current tracking and trainer flows are stable.
