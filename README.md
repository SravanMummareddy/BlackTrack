# BlackStack

A premium mobile app for tracking casino sessions and mastering blackjack basic strategy.

---

## What It Does

**Track side** — Log casino visits as sessions. Each session belongs to one casino and date, with a sub-ledger of games (Blackjack, Poker, Roulette, Slots, etc.), each carrying its own buy-in and cash-out. Net P/L auto-sums. Optional metadata: mood before/after, tags (disciplined, tilted, chasing, lucky), and free-form notes. The home screen shows a monthly budget ring, period-switchable stats (W/L, avg, net), and recent history.

**Learn side** — Blackjack Trainer evaluates your plays against textbook basic strategy with green glow / red shake feedback and plain-English reasoning. Learn hub: Lessons, Flashcards, Quiz, Strategy Chart, Mistakes review queue.

**Responsible gambling** — Budget ring is the dashboard hero. Per-session loss/time limits with reflection prompts. 24h / 7d / 30d break options.

---

## Design

Premium dark theme — near-black (`#0b0b0d`), warm gold accents (`#d4af6a → #a98741`), Fraunces display, Inter UI, JetBrains Mono for numbers. Open `design/v2.html` in a browser to see the final direction.

---

## Quick Start (Design Review)

No install needed — open directly in a browser:

```sh
open design/v2.html          # most current visual direction
open design/prototype.html   # interactive clickable prototype
open design/wireframes.html  # screen A/B/C explorations
```

---

## Quick Start (Development)

```sh
bun install
cp config/.env.example .env.local
# Edit .env.local with your values

docker compose -f docker/docker-compose.yml up -d postgres redis
bun run db:migrate
bun run seed:strategy
bun run dev
```

App starts at `http://localhost:3000`.

---

## Runtime: Bun

This project uses [Bun](https://bun.sh) (v1.3+) as the runtime and package manager.

```sh
bun install          # install dependencies
bun run dev          # dev server with hot reload
bun test             # run tests (built-in test runner)
bun add <pkg>        # add a dependency
bun run build        # TypeScript compile
bun run handoff      # pre-agent-switch validation
bun run sync         # regenerate agent instruction files
```

---

## Claude Code Plugins

This workspace has 5 plugins active:

| Plugin | Purpose |
|---|---|
| **superpowers** | 11 workflow skills — planning, TDD, debugging, code review, parallel agents |
| **context-mode** | Compresses large outputs to protect context window (auto-runs via hooks) |
| **claude-mem** | Persistent cross-session memory — remembers decisions and work across sessions |
| **skill-creator** | Create and optimize project-specific skills |
| **frontend-design** | UI/component design and implementation |

See `AGENTS.md` for how to use them in the multi-agent workflow.

---

## Folder Structure

```
design/
  ├── wireframes.html        Screen variant canvas (A/B/C per screen)
  ├── prototype.html         Interactive clickable prototype
  ├── v2.html                V2 gold/black direction (most current)
  ├── shared/                Canvas utilities shared across layers
  ├── wireframes/            Wireframe layer (phone shell + screen variants)
  ├── prototype/             Prototype layer (frame, trainer engine, screens)
  └── v2/                    V2 layer (frame, screens, app)

src/
  ├── auth/                  JWT, passwords, OAuth2
  ├── api/                   HTTP route handlers
  ├── database/              Prisma client + connection setup
  ├── services/              Business logic (sessions, analytics, strategy)
  ├── middleware/            Auth, validation, error handler, rate limiter
  ├── utils/                 Errors, logger, validators
  └── types/                 TypeScript type definitions

assets/                      Screenshots and static assets
tests/                       unit/, integration/, e2e/
scripts/                     handoff.sh, dev.sh, sync-instructions.sh
docker/                      Dockerfile + docker-compose.yml
config/                      .env.example
docs/                        Architecture, API, database, deployment, runbook
.shared/                     Agent instructions, skills, context, schemas
.claude/                     Claude Code agent config
.opencode/                   OpenCode agent config
```

---

## Development Commands

```sh
bun test                # all tests (70% coverage required)
bun run lint            # ESLint
bun run typecheck       # TypeScript strict check
bun run db:migrate      # create + apply Prisma migration
bun run db:studio       # Prisma Studio (database browser)
bun run seed:strategy   # populate blackjack basic-strategy scenarios
bun run handoff         # pre-agent-switch validation
bun run sync            # regenerate agent instruction files
```

---

## Backend Status

Current API coverage includes:

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- `GET/POST/PATCH/DELETE /api/v1/sessions`
- `POST /api/v1/sessions/:sessionId/hands`
- `GET /api/v1/sessions/:sessionId/hands`
- `GET /api/v1/sessions/:sessionId/hands/stats`
- `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `GET /api/v1/users/me/stats`
- `GET /api/v1/strategy/scenarios/random`, `POST /api/v1/strategy/attempts`, `GET /api/v1/strategy/progress`

Conventions:

- Money values are stored as integer cents.
- Route handlers throw typed errors; the global error middleware formats responses.
- Protected routes rely on `authenticate`, which populates `req.userId`.

---

## Docs

| Doc | Path |
|---|---|
| Architecture | `docs/ARCHITECTURE.md` |
| Style guide | `docs/STYLE_GUIDE.md` |
| API reference | `docs/API.md` |
| Database | `docs/DATABASE.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| Runbook | `docs/RUNBOOK.md` |
| Multi-agent workflow | `AGENTS.md` |
| Coding standards + plugin guide | `.shared/CANONICAL_INSTRUCTIONS.md` |
