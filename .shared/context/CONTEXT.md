# Agent Context — BlackStack

> Update this file before every agent handoff.
> The incoming agent reads this first.

---

## Current State Summary

Design exploration is complete and the backend is partially operational. Three prototype iterations still live in `design/` (wireframes → prototype → v2), and `design/prototype.html` is the currently accepted visual/interaction reference. The Express/Prisma backend supports auth, sessions, nested hand logging, overall bankroll stats, and strategy training endpoints. A real responsive web app is now being built under `public/`, served by Express, and has working auth, sessions, and trainer slices, but it is not feature-complete yet.

**Branch**: `main`
**Last commit**: Initial commit + skeleton + design reorganization
**Environment**: Development — local only

---

## Completed This Session

- [x] API router composition completed in `src/api/index.ts`
- [x] `GET /users/me`, `PATCH /users/me`, and `GET /users/me/stats` available under `/api/v1/users`
- [x] Nested hand routes active under `/api/v1/sessions/:sessionId/hands`
- [x] Basic-strategy engine ported into `src/services/strategy-service.ts`
- [x] Strategy endpoints added in `src/api/strategy.ts`
- [x] Idempotent `bun run seed:strategy` command added
- [x] `bun run typecheck` passes
- [x] Prototype frontend restored after an unsuccessful API-coupled rewrite
- [x] Responsive web app shell started in `public/index.html`, `public/styles.css`, and `public/app.js`
- [x] Express now serves the web app shell from `/`
- [x] Chunk 1 completed: `/` serves correctly and auth register/login/refresh/logout flows were validated against the live API
- [x] Chunk 2 completed: sessions workspace flow validated for session selection, create session, log hand, complete session, and session stats refresh
- [x] Chunk 3 completed: trainer workspace now auto-loads a hand on entry, tracks real response time, surfaces progress metrics, and advances directly to the next hand
- [x] Chunk 4 completed: dashboard and trainer layouts were refined for desktop/tablet, with quick actions, active-session focus, and a safer hand-log shortcut
- [x] Docs slice completed: `README.md` and `docs/API.md` now reflect the real Blackjack tracker + trainer application

---

## In Progress

- [ ] Responsive web app implementation in small vertical slices
- [ ] Chunk 5 — tests, docs refresh, and remaining UI polish
- [ ] API test coverage
- [ ] Template docs cleanup for architecture, database, deployment, runbook, and style guide

---

## Blockers

| Blocker | Impact | Owner | Notes |
|---|---|---|---|
| No active blockers | Low | — | Main constraint is scope; work should proceed in smaller chunks with checkpoints |

---

## Key Changes

<!-- Specific files or modules that were modified — helps incoming agent orient quickly -->
- `src/api/index.ts` — wired auth, sessions, nested hands, users, and strategy routers
- `src/api/users.ts` — added `/me` and `/me/stats`
- `src/api/strategy.ts` — added random scenario, attempt submission, and progress endpoints
- `src/services/strategy-service.ts` — ported strategy tables, evaluation logic, seed payload builder
- `scripts/seed-strategy.ts` — idempotent seed script based on the shared strategy tables
- `public/index.html` — initial web app HTML entrypoint
- `public/styles.css` — responsive design system and application shell styling
- `public/app.js` — client-side app state, auth flow, dashboard/session/trainer flows, and responsive shortcuts
- `design/prototype*.html/jsx` — restored to original prototype behavior after reverting API-coupled experiment

---

## Test Status

```
Unit tests:       Not run
Integration:      Not run
Coverage:         Unknown
Last run:         2026-05-14 — `bun run typecheck` passing; `/` verified by curl; auth flows verified by live API requests
Sessions run:     2026-05-14 — create session, log hand, complete session, list session, and fetch session stats verified by live API requests
Trainer run:      2026-05-14 — random scenario, attempt submission, and progress metrics verified by live API requests
UI polish run:    2026-05-14 — responsive dashboard/trainer layout refinements applied; client syntax verified
Docs run:         2026-05-14 — `README.md` and `docs/API.md` refreshed to match the live backend and web app
```

---

## Next Steps for Incoming Agent

1. Complete Chunk 5: add integration tests and clean up the remaining template-heavy docs
2. Add integration tests for auth, session lifecycle, hands, user stats, and strategy endpoints
3. Refresh `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DEPLOYMENT.md`, and `docs/RUNBOOK.md` so they stop describing placeholder infrastructure
4. Continue shipping in small vertical slices with git checkpoints after each usable milestone

---

## Important Notes

<!-- Anything the next agent needs to know that isn't captured elsewhere -->
- Money remains integer cents everywhere in the API and DB.
- Strategy scenarios are seeded from the same lookup tables used for runtime evaluation to avoid drift.
- The user explicitly wants the original prototype/frontend preserved as reference while the real web app is built separately.
- No automated endpoint tests have been added yet, so behavior is only compiler-verified right now.
- Work should be delivered in smaller chunks with regular git checkpoints and markdown updates.
- Trainer progress now uses real measured response time from scenario load until answer submission.
- Dashboard shortcuts now explicitly load the active session before opening the hand logger to avoid logging against stale selection state.
- `README.md` and `docs/API.md` are current; the other docs still contain placeholder references to Redis, generic posts data, or example deployments.
