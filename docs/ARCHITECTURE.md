# Architecture — BlackStack

---

## System Design Overview

BlackStack is a mobile-first web application following a layered architecture:

```
┌─────────────────────────────────────────────┐
│                   Clients                    │
│         (Browser, Mobile, API clients)       │
└────────────────────┬────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────┐
│              Next.js / Express               │
│         Route Handlers (src/api/)            │
│         Middleware (src/middleware/)          │
└──────┬──────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│           Business Logic Layer               │
│              Services (src/services/)         │
└──────┬──────────────────┬───────────────────┘
       │                  │
┌──────▼──────┐   ┌───────▼───────┐
│  PostgreSQL  │   │     Redis     │
│  (Prisma)    │   │   (Cache /    │
│  Primary DB  │   │  Rate Limit)  │
└─────────────┘   └───────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API routes, full-stack TypeScript |
| Language | TypeScript (strict) | Type safety, better tooling |
| ORM | Prisma | Type-safe DB access, migration management |
| Database | PostgreSQL 15 | ACID compliance, JSONB, full-text search |
| Cache | Redis | Session storage, rate limiting, hot data |
| Auth | JWT + bcryptjs | Stateless, widely supported |
| Validation | Zod | Runtime validation + TypeScript types from one schema |
| Testing | Jest + ts-jest + Supertest | Comprehensive unit + integration testing |
| Container | Docker | Reproducible environments |

---

## Domain Overview

BlackStack has two main product areas:

**Track** — Casino session logging
- Sessions belong to a user, a casino, and a date
- Each session has a sub-ledger of game entries (Blackjack, Poker, Roulette, Slots…)
- Each game entry carries buy-in and cash-out; session net auto-sums
- Sessions carry optional metadata: mood (before/after), tags, free-form notes
- Home screen: monthly budget ring, period-switchable stats (W/L, avg, net)
- Analytics: cumulative net chart, mood × result scatter, per-casino / per-game breakdown

**Learn** — Blackjack strategy mastery
- Trainer: deals real random hands, evaluates against textbook basic strategy
- Strategy Chart: Hard / Soft / Pairs reference
- Lessons, Flashcards, Quiz, Mistakes review queue
- Streak and accuracy stats persist across sessions

**Responsible Gambling** — woven through, not buried
- Budget ring is the dashboard hero
- Per-session loss/time limits with reflection prompts (not hard blocks)
- 24h / 7d / 30d break options
- Get Help link in Settings

---

## Module Breakdown

### `src/auth/`
Handles authentication and authorization.
- Token generation and verification (JWT)
- Password hashing (bcrypt)
- OAuth2 flow coordination
- No database access — calls service layer

### `src/api/`
HTTP layer only. Maps routes to service calls.
- Input validation (via Zod middleware)
- Authentication guard (via auth middleware)
- Delegates all business logic to `src/services/`
- Returns structured responses

### `src/services/`
Business logic. This is where decisions are made.
- Orchestrates DB operations
- Applies business rules
- Calls other services (not routes)
- Returns domain objects (not HTTP responses)

### `src/database/`
Database infrastructure.
- Prisma client singleton
- Connection pool configuration
- Redis client

### `src/middleware/`
Cross-cutting concerns applied to routes.
- Authentication
- Request validation
- Rate limiting
- Error handling
- Request logging

### `src/utils/`
Pure helper functions with no side effects.
- Error class definitions
- Logger configuration
- Common validators

---

## Data Flow

### Authenticated Request

```
Client
  → HTTP request
  → Rate limiter middleware
  → Auth middleware (verify JWT)
  → Validation middleware (Zod schema)
  → Route handler
  → Service layer
    → Prisma (PostgreSQL)
    → Redis (cache check/set)
  → Route handler formats response
  → HTTP response → Client
```

### Error Flow

```
Any layer throws AppError (or subclass)
  → Express error handler middleware catches it
  → Formats as { error: { code, message, details } }
  → Returns appropriate HTTP status code
  → Logs at warn level with request context

Any layer throws unexpected Error
  → Express error handler catches it
  → Returns 500 with generic message
  → Logs at error level with full stack trace
```

---

## Scaling Considerations

- **Horizontal scaling**: Stateless app servers — scale by adding instances. Session state lives in Redis, not in-process.
- **Database**: Use read replicas for heavy read workloads. Consider PgBouncer for connection pooling at scale.
- **Caching**: Cache aggressively at the service layer. Cache invalidate on write.
- **Rate limiting**: Stored in Redis — works across multiple app instances.

---

## Deployment Strategy

| Environment | Deploy Trigger | Database Migrations |
|---|---|---|
| Development | Local `npm run dev` | Manual `npx prisma migrate dev` |
| Staging | Push to `staging` branch | Auto on deploy via `prisma migrate deploy` |
| Production | Tag `v*.*.*` on `main` | Manual approval + `prisma migrate deploy` |

See `docs/DEPLOYMENT.md` for detailed steps.
