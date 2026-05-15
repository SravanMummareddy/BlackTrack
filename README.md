# BlackStack

BlackStack is a responsive blackjack session tracker and basic-strategy trainer built with Bun, Express, Prisma, and PostgreSQL.

The repository contains two different frontend surfaces:
- `design/` holds the reference prototypes and visual explorations
- `public/` is the real web application served by Express at `/`

## Current Product Scope

BlackStack currently focuses on two connected workflows:

1. Track live blackjack sessions
- create a session with casino name, table limits, decks, buy-in, and notes
- log hands inside that session with bet, result, totals, cards, and payout
- complete the session with a cash-out amount
- review bankroll and hand-level stats

2. Train blackjack basic strategy
- fetch random strategy scenarios from the API
- submit attempts against the live strategy engine
- track attempts, accuracy, and average response time
- reference the same strategy chart used to seed and evaluate scenarios

## Tech Stack

- Runtime: Bun
- Server: Express
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- Auth: JWT
- Frontend: static responsive web app in `public/`

## Local Development

```sh
bun install
cp config/.env.example .env.local
docker compose -f docker/docker-compose.yml up -d postgres
bun run db:migrate
bun run seed:strategy
bun run dev
```

App URLs:
- web app: `http://localhost:3000/`
- API base: `http://localhost:3000/api/v1`
- health: `http://localhost:3000/api/v1/health`
- design prototype: `http://localhost:4173/prototype.html` if you run a static server for `design/`

## Useful Commands

```sh
bun run dev
bun run typecheck
bun run test
bun run test:integration
bun run db:migrate
bun run db:studio
bun run seed:strategy
```

## Project Structure

```text
public/                  real responsive web app
design/                  reference-only prototypes and design explorations
src/api/                 Express route handlers
src/services/            business logic
src/auth/                JWT and password helpers
src/middleware/          auth, logging, error handling
src/database/            Prisma client and DB helpers
prisma/                  schema and migrations
tests/                   unit, integration, e2e placeholders
.shared/context/         handoff and planning files
```

## API Surface

Implemented endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/:id`
- `PATCH /api/v1/sessions/:id`
- `DELETE /api/v1/sessions/:id`
- `POST /api/v1/sessions/:sessionId/hands`
- `GET /api/v1/sessions/:sessionId/hands`
- `GET /api/v1/sessions/:sessionId/hands/stats`
- `PATCH /api/v1/sessions/:sessionId/hands/:handId`
- `DELETE /api/v1/sessions/:sessionId/hands/:handId`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `GET /api/v1/users/me/export`
- `DELETE /api/v1/users/me`
- `GET /api/v1/users/me/stats`
- `GET /api/v1/strategy/scenarios/random`
- `POST /api/v1/strategy/attempts`
- `GET /api/v1/strategy/progress`

See [docs/API.md](/Users/smumma/Documents/BlackStack/BlackStack/docs/API.md:1) for request and response details.

## Important Conventions

- Money is stored and transmitted as integer cents.
- Protected routes require `Authorization: Bearer <accessToken>`.
- Route handlers throw typed errors; the global error middleware formats responses.
- `design/` should stay intact as reference material while product code evolves in `public/`.

## Current Status

Done:
- backend auth, sessions, hands, user stats, and strategy endpoints
- responsive web app shell
- auth flow
- session workspace
- trainer workspace
- responsive dashboard/trainer polish
- hand/session correction flows with active-session live P/L
- account lifecycle controls: change password, JSON export, delete account

Still needed:
- strategy content verification
- responsible-play session limits and break mode
- deeper analytics and learning content
