# Codebase Summary — BlackStack

> Auto-update this when module structure changes significantly.

---

## Quick Stats

| Metric | Value |
|---|---|
| Runtime | Bun 1.3.14 |
| Language | TypeScript (strict) |
| Framework | Express + static web client |
| ORM | Prisma + PostgreSQL |
| Test runner | Bun test |
| Status | Backend partial + real responsive web app in progress |
| Last updated | 2026-05-14 |

---

## Active Claude Code Plugins

| Plugin | Role |
|---|---|
| superpowers | Workflow discipline (planning, TDD, review) |
| context-mode | Context window protection (auto-hooks) |
| claude-mem | Cross-session memory |
| skill-creator | Custom skill development |
| frontend-design | UI/component implementation |

---

## Design Artifacts (read-only reference)

```
design/
  v2.html             ← OPEN THIS to see the target UI
  prototype.html      ← interactive prototype (routing, trainer engine)
  wireframes.html     ← screen A/B/C explorations
  shared/             ← design-canvas.jsx, tweaks-panel.jsx
  wireframes/         ← phone shell + per-screen variants
  prototype/          ← frame.jsx, trainer.jsx (strategy engine), screens.jsx
  v2/                 ← frame.jsx (V design tokens), screens.jsx, app.jsx
```

**Important**: `design/v2/frame.jsx` contains the `V` object — all design tokens (colors, typography, spacing). Reference it when building any UI component.

The basic strategy engine from `design/prototype/trainer.jsx` has already been ported into `src/services/strategy-service.ts`. The prototype remains a design/interaction reference and should not be treated as the production app itself.

## Production Web App

```
public/
  index.html            ← real web app entrypoint served at `/`
  styles.css            ← responsive layout, design tokens, component styling
  app.js                ← client-side state, API calls, dashboard/session/trainer shell
```

The production web app is intentionally separate from `design/`. `design/` is reference-only; `public/` is the real browser application being built.

Current status of `public/`:
- `/` is served by Express
- auth shell is wired to the live API
- dashboard shell hydrates from `/users/me`, `/users/me/stats`, `/sessions`, and `/strategy/progress`
- sessions workspace now supports selection, create session, complete session, and hand logging against the live API
- trainer workspace now supports auto-loading scenarios, attempt submission, live progress metrics, and next-hand flow against the live API
- next major slice is responsive polish, dashboard refinement, and chart/reference fit-and-finish

---

## Module Overview

### `src/auth/`
Authentication. JWT generation/verification, bcrypt passwords, OAuth2 (Google, GitHub).
- **Entry**: `src/auth/index.ts`
- **Key files**: `tokens.ts`, `passwords.ts`, `oauth.ts`

### `src/api/`
HTTP route handlers. Maps requests to service calls — no business logic here.
- **Pattern**: one router file per domain resource
- Currently has: auth, sessions, nested hands, users, strategy, and health endpoints

### `src/services/`
Business logic layer. **This is where most BlackStack work happens.**
- Session CRUD and net P/L computation → `session-service.ts`
- Hand logging and session stats → `hand-service.ts`
- Basic strategy engine + seed data generation → `strategy-service.ts`
- Analytics aggregations beyond overall bankroll stats are still TBD

### `src/database/`
Prisma singleton + connection pool config. Redis client TBD.
- `index.ts` — Prisma singleton (hot-reload safe)
- `pool.ts` — pool config per environment

### `src/middleware/`
- `requestId`, `requestLogger`, `authenticate`, `optionalAuth`, `errorHandler`

### `src/utils/`
- `errors.ts` — AppError, ValidationError, NotFoundError, etc.
- `logger.ts` — Winston structured logger
- `validation.ts` — reusable Zod schemas

### `src/types/`
TypeScript types shared across modules. Express Request augmentation.

---

## Where to Make Changes

| If you need to... | Go to... |
|---|---|
| Add API endpoint | `src/api/` + register in `src/api/index.ts` |
| Add business logic | `src/services/` |
| Change DB schema | `prisma/schema.prisma` + `bun run db:migrate` |
| Add middleware | `src/middleware/index.ts` |
| Add a type | `src/types/index.ts` |
| Add a utility | `src/utils/` |
| Add a config value | `src/config/env.ts` + `config/.env.example` |
| Build the real web UI | `public/` and serve from `src/index.ts` |
| Reference design direction | `design/v2/` and `design/prototype/` |
| Extend strategy engine | `src/services/strategy-service.ts` |
