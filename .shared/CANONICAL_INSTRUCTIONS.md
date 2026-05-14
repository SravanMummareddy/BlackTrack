# Canonical Instructions for AI Agents — BlackStack

> This is the single source of truth for all agents working in this codebase.
> Run `./scripts/sync-instructions.sh` to regenerate agent-specific files from this source.

---

## Project: BlackStack

A premium mobile app for tracking casino sessions and mastering blackjack basic strategy.

Two product areas:
- **Track**: Casino session logging with game sub-ledger, mood/tags, budget ring, analytics
- **Learn**: Blackjack trainer (basic strategy evaluation), flashcards, quiz, strategy chart

Design system: near-black (`#0b0b0d`) + warm gold (`#d4af6a → #a98741`), Fraunces display, Inter UI, JetBrains Mono for numbers.

Current phase: Design exploration complete (see `design/`). Building production app in `src/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun 1.3+ |
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL 15+ |
| Caching | Redis |
| Testing | Bun test (built-in) |
| Linting | ESLint + Prettier |
| Validation | Zod |
| Auth | JWT + bcryptjs |
| Containerization | Docker + docker-compose |

---

## Runtime: Bun

Use Bun for all package management and running scripts. Do NOT use `npm`, `npx`, or `node` directly unless a tool requires it.

```sh
bun install          # install dependencies (replaces npm install)
bun run dev          # start dev server with hot reload
bun test             # run tests
bun run build        # TypeScript compile
bun add <pkg>        # add dependency (replaces npm install <pkg>)
bun add -d <pkg>     # add dev dependency
```

Bun is a drop-in replacement for Node.js and npm — it runs TypeScript natively without ts-node.

---

## Installed Claude Code Plugins

These plugins are active in this workspace. Use them — don't work around them.

### superpowers
11 workflow skills for disciplined development. **Always invoke the relevant skill before starting work.**

| Skill | Trigger |
|---|---|
| `writing-plans` | Before touching code on any multi-step task |
| `brainstorming` | Before any creative/feature work |
| `test-driven-development` | Before writing implementation code |
| `systematic-debugging` | Before proposing fixes for bugs |
| `verification-before-completion` | Before claiming work is done or creating PRs |
| `requesting-code-review` | After completing a feature |
| `dispatching-parallel-agents` | When 2+ tasks are independent |
| `executing-plans` | When running a written plan in a fresh session |
| `finishing-a-development-branch` | When ready to merge |
| `using-git-worktrees` | Before feature work that needs isolation |
| `subagent-driven-development` | When executing plans with independent tasks |

### context-mode
Compresses large tool outputs to protect the context window. **Runs automatically via hooks.**
- Use `ctx_execute` / `ctx_batch_execute` for large shell output
- `/context-mode:ctx-stats` — see context savings this session
- `/context-mode:ctx-insight` — analytics dashboard
- `/context-mode:ctx-doctor` — diagnostics

### claude-mem
Persistent cross-session memory. Automatically captures observations.
- `/claude-mem:learn-codebase` — prime memory with the full codebase at session start
- `/claude-mem:mem-search` — search what was done in previous sessions
- `/claude-mem:make-plan` — create a persisted plan
- `/claude-mem:knowledge-agent` — query accumulated knowledge

### skill-creator
Create, test, and optimize new skills for this project.
- Use when a recurring pattern needs a dedicated skill
- `/skill-creator:skill-creator` — launch skill creation

### frontend-design
Frontend/UI-focused design and implementation.
- Use when building React components, screens, or implementing the v2 design system
- Knows the BlackStack gold/black design tokens from `design/v2/frame.jsx`

---

## Coding Standards

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `user-service.ts`, `auth-middleware.ts`)
- **Functions/variables**: `camelCase` (e.g., `getUserById`, `isAuthenticated`)
- **Types/Interfaces/Classes**: `PascalCase` (e.g., `UserProfile`, `AuthToken`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`, `MAX_RETRY_COUNT`)
- **Database tables/columns**: `snake_case` (e.g., `created_at`, `user_id`)
- **Environment variables**: `UPPER_SNAKE_CASE`

### Code Structure

- Keep functions small (< 40 lines). If larger, extract helpers.
- One responsibility per file. If a file grows > 200 lines, split it.
- Imports order: Node built-ins → third-party → internal → types
- Always use explicit return types on exported functions.
- Prefer `async/await` over raw Promises.
- Never use `any`. Use `unknown` and narrow the type.

### Error Handling

- All async functions must be wrapped in try/catch at the boundary.
- Use custom error classes from `src/utils/errors.ts`.
- Always log errors with context (user ID, request ID, operation name).
- Never swallow errors silently.
- Return structured error responses (see `.shared/skills/api-patterns/error-handling.md`).

### Comments

- Comment **why**, not **what**. Good code explains itself.
- Use `// TODO: [task description]` for deferred work.
- Add a comment when working around a known bug or limitation.

---

## Database

### Connection Pooling
- Use Prisma's built-in connection pool.
- Default pool: `min=2, max=10` for development; `min=5, max=20` for production.
- Always close connections gracefully on shutdown.
- See `.shared/skills/database-patterns/connection-pooling.md`.

### Migrations
- Never edit existing migrations — always create new ones.
- Migration naming: `YYYYMMDD_HHmmss_description.sql`
- Test migrations on staging before production.
- Always include both `up` and `down` migration paths.

### Transactions
- Wrap multi-step writes in a transaction.
- Don't perform I/O (HTTP calls) inside a transaction.
- See `.shared/skills/database-patterns/transaction-safety.md`.

### Indexes
- Add indexes for all foreign keys.
- Add indexes for columns used in WHERE, ORDER BY, or JOIN frequently.
- Analyze slow queries with `EXPLAIN ANALYZE`.
- See `.shared/skills/database-patterns/query-optimization.md`.

---

## API Design

### REST Endpoint Conventions
- Plural nouns: `/api/sessions`, `/api/casinos`
- Nested: `/api/sessions/:id/games`
- Versioned: `/api/v1/...`

### Validation
- Validate all request bodies, query params, path params with Zod.
- Return 400 with field-level errors on validation failure.
- See `.shared/skills/api-patterns/validation.md`.

### Authentication
- JWT in HTTP-only cookies for browser clients; Bearer tokens for API clients.
- See `.shared/skills/api-patterns/authentication.md`.

---

## Testing

- Use `bun test` (built-in test runner).
- Every service function needs a unit test.
- Integration tests use a real test database.
- Minimum: **70% line coverage**.
- See `.shared/skills/testing-patterns/` for templates.

---

## Common Pitfalls

1. **Hardcoded values** — use env vars. Never hardcode URLs, secrets, or IDs.
2. **N+1 queries** — always use `include` or batch queries instead of querying in loops.
3. **Missing error handling** — every `await` needs a try/catch or `.catch()`.
4. **Unvalidated input** — never trust `req.body` or `req.query` directly.
5. **Leaking secrets** — never log tokens, passwords, or auth headers.
6. **Race conditions** — use DB transactions for concurrent write scenarios.
7. **No index on FK** — always add indexes on foreign key columns.

---

## Handoff Protocol

Before switching agents:
1. Run `bun run handoff` (runs `./scripts/handoff.sh`)
2. Commit all in-progress work (use `wip:` prefix if incomplete)
3. Update `.shared/context/CONTEXT.md`
4. Update `.shared/context/TODO.md`
5. Log decisions in `.shared/context/DECISIONS.md`

Incoming agent:
1. Read `.shared/context/CONTEXT.md`
2. Read `.shared/context/TODO.md`
3. Run `bun install && bun test`
4. Run `/claude-mem:learn-codebase` if starting fresh
