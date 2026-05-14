# Agent Context — BlackStack

> Update this file before every agent handoff.
> The incoming agent reads this first.

---

## Current State Summary

Design exploration is complete and the backend is partially operational. Three prototype iterations still live in `design/` (wireframes → prototype → v2), and `design/prototype.html` is the currently accepted visual/interaction reference. The Express/Prisma backend supports auth, sessions, nested hand logging, overall bankroll stats, and strategy training endpoints. A real responsive web app has now been started under `public/` and is being served by Express, but it is only at the application-shell stage and is not feature-complete yet.

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

---

## In Progress

- [ ] Responsive web app implementation in small vertical slices
- [ ] Chunk 2 — sessions workspace (list/detail/create/complete/log hand)
- [ ] API test coverage
- [ ] Docs/API reference refresh

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
- `public/app.js` — initial client-side app state, auth flow, dashboard/session/trainer shell logic
- `design/prototype*.html/jsx` — restored to original prototype behavior after reverting API-coupled experiment

---

## Test Status

```
Unit tests:       Not run
Integration:      Not run
Coverage:         Unknown
Last run:         2026-05-14 — `bun run typecheck` passing; `/` verified by curl; auth flows verified by live API requests
```

---

## Next Steps for Incoming Agent

1. Complete Chunk 2: sessions workspace with live session list, session detail, create session, complete session, and hand logging
2. Complete Chunk 3: trainer interactivity, progress, and chart/reference flows in the web app
3. Add integration tests for auth, session lifecycle, hands, user stats, and strategy endpoints
4. Refresh `docs/API.md`, `README.md`, and product-facing docs once the first usable web slice is stable

---

## Important Notes

<!-- Anything the next agent needs to know that isn't captured elsewhere -->
- Money remains integer cents everywhere in the API and DB.
- Strategy scenarios are seeded from the same lookup tables used for runtime evaluation to avoid drift.
- The user explicitly wants the original prototype/frontend preserved as reference while the real web app is built separately.
- No automated endpoint tests have been added yet, so behavior is only compiler-verified right now.
- Work should be delivered in smaller chunks with regular git checkpoints and markdown updates.
