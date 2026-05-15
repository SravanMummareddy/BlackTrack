# Agent Context — BlackStack

> Update this file before every agent handoff.
> The incoming agent reads this first.

---

## Current State Summary

Design exploration is complete and the backend is partially operational. Three prototype iterations still live in `design/` (wireframes → prototype → v2), and `design/prototype.html` is the currently accepted visual/interaction reference. The Express/Prisma backend supports auth, sessions, nested hand logging, overall bankroll stats, and strategy training endpoints. A real responsive web app is now being built under `public/`, served by Express, and has working auth, sessions, and trainer slices, but it is not feature-complete yet.

**Branch**: `main` after merging `feat/slice-b-budget-ring`
**Last completed slice commit**: `328c0bd chore: fix handoff tooling checks`
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
- [x] Integration test slice completed: auth, sessions, hands, user stats, and strategy flows now have a real API integration test
- [x] Docs cleanup slice completed: architecture, database, deployment, runbook, and style guide docs now reflect the current app instead of templates
- [x] Analytics slice completed: `/users/me/stats` now supports period filtering and casino breakdowns, and the dashboard consumes those live analytics
- [x] Strategy progression slice completed: trainer progress now includes streaks and a mistakes review queue with direct scenario reloads
- [x] Landing / auth UX hardening (2026-05-15):
  - Fixed CSS that hid the entire login/signup card below 1200px (`.hero-grid > :last-child { display: none }`) and again below 1024px (`.auth-layout > :first-child { display: none }`). Auth card now visible at every breakpoint; hero columns reflow with `minmax()` so login no longer feels squished on desktop.
  - Added live HCI-style validation on register/login: email regex (input + blur), name length (blur), password rules as a `✓/○` checklist plus a 4-segment strength bar that updates per keystroke. `submitAuth` blocks network calls when client-side rules fail and shows the specific failing rule inline.
  - Real guest mode: `try-guest` action shows the basic-strategy chart reference + banner explaining sessions/trainer progress require an account; `exit-guest` returns to the sign-in form. Topbar exposes the CTA.
  - Post-login routing fixed: `submitAuth` sets `state.currentView = "dashboard"` and clears `state.guestMode`; `hydrateApp` wraps the parallel hydration in `try/finally` so `state.loading.app` always clears (kills the stuck "Loading application" screen).
  - Logout fully resets `loading.app`, `guestMode`, and `authMode`.
- [x] Slice A session metadata (2026-05-15):
  - API validators now accept and normalize session `tags`, `moodStart`, `moodEnd`, and `completionNotes`.
  - Integration coverage was updated to assert create/list/complete metadata round trips.
  - Production web app create-session and complete-session modals now collect predefined tags, custom tags, starting mood, ending mood, and completion notes.
  - Dashboard active-session focus, session rows, and session detail now surface tags, mood, and completion notes.
  - `docs/API.md` documents the new session metadata request/response fields.
- [x] Slice B budget ring (2026-05-15):
  - Monthly budget schema, migration, service helpers, API endpoints, unit tests, and integration tests are in place.
  - Dashboard now loads `/users/me/budget`, renders a monthly net-loss ring with ok/caution/over states, and supports inline budget save/edit.
  - `docs/API.md` documents `GET /users/me/budget`, `PUT /users/me/budget`, and `GET /users/me/budget/history`.
- [x] Slice C0 baseline correction features (2026-05-15):
  - Session responses now include `liveNetProfit` from logged hand payouts plus `netProfit` from completed cash-out.
  - Session PATCH now supports correcting casino name, table min/max, decks, buy-in, notes, tags, and starting mood; completed sessions can be reopened by setting `status: "ACTIVE"`.
  - Nested hand routes now support `PATCH /sessions/:sessionId/hands/:handId` and `DELETE /sessions/:sessionId/hands/:handId`, with parent session counters recalculated after corrections.
  - Production UI now exposes edit/delete/reopen session controls, edit/delete hand controls, and active-session live P/L in dashboard/session views.
  - Express async error handling was added to the touched sessions/hands routers so 404/validation errors flow through the existing error middleware.

---

## In Progress

- [ ] Responsive web app implementation in small vertical slices
- [ ] Slice C1 — account lifecycle controls

---

## Blockers

| Blocker | Impact | Owner | Notes |
|---|---|---|---|
| No active tooling blockers | Low | — | Handoff script, ESLint config, and local generated-file ignore rules were fixed after Slice B merge. |
| Product scope | Low | Next feature slice | Main constraint is scope; work should proceed in smaller chunks with checkpoints. |

---

## Key Changes

<!-- Specific files or modules that were modified — helps incoming agent orient quickly -->
- `src/api/index.ts` — wired auth, sessions, nested hands, users, and strategy routers
- `src/api/users.ts` — added `/me` and `/me/stats`
- `src/api/budget.ts` — added monthly budget view, upsert, and history endpoints
- `src/services/budget-service.ts` — budget month math, effective-setting resolver, state classification, monthly aggregation
- `src/api/hands.ts` — added hand correction routes and async error wrapping
- `src/services/hand-service.ts` — added hand update/delete and session counter recalculation
- `src/services/session-service.ts` — added enriched session responses with live P/L and broader session correction fields
- `src/api/strategy.ts` — added random scenario, attempt submission, and progress endpoints
- `src/services/strategy-service.ts` — ported strategy tables, evaluation logic, seed payload builder
- `scripts/seed-strategy.ts` — idempotent seed script based on the shared strategy tables
- `public/index.html` — initial web app HTML entrypoint
- `public/styles.css` — responsive design system, application shell styling, metadata chip/readout styling, and budget ring styles
- `public/app.js` — client-side app state, auth flow, dashboard/session/trainer flows, metadata capture, budget ring, and responsive shortcuts
- `design/prototype*.html/jsx` — restored to original prototype behavior after reverting API-coupled experiment

---

## Test Status

```
Unit tests:       Not run
Integration:      `tests/integration/api.integration.test.ts`
Coverage:         Unknown
Last run:         2026-05-14 — `bun run typecheck` passing; `/` verified by curl; auth flows verified by live API requests
Sessions run:     2026-05-14 — create session, log hand, complete session, list session, and fetch session stats verified by live API requests
Trainer run:      2026-05-14 — random scenario, attempt submission, and progress metrics verified by live API requests
UI polish run:    2026-05-14 — responsive dashboard/trainer layout refinements applied; client syntax verified
Docs run:         2026-05-14 — `README.md` and `docs/API.md` refreshed to match the live backend and web app
Test run:         2026-05-14 — integration suite passed with 4 tests / 48 assertions against local Postgres after applying migrations
Docs cleanup:     2026-05-14 — architecture, database, deployment, runbook, and style guide docs rewritten around the real app
Analytics run:    2026-05-14 — typecheck passed; integration suite passed with 58 assertions after adding period and casino analytics coverage
Progression run:  2026-05-14 — typecheck passed; integration suite passed with 67 assertions after adding streaks and mistakes review coverage
Metadata run:     2026-05-15 — `node --check public/app.js` passed; `bun run typecheck` passed; full `bun test` passed with 20 tests / 2897 assertions after fixing the test harness app import. `bun run lint` is blocked because the repo has no ESLint config file.
Budget run:       2026-05-15 — `node --check public/app.js` passed; `bun run typecheck` passed; `bun test tests/unit/budget-service.test.ts` passed; `bun test tests/integration/api.integration.test.ts` passed with 10 tests / 109 assertions.
Merge run:        2026-05-15 — `node --check public/app.js` passed; `bun run typecheck` passed; full `bun test` passed with 44 tests / 2957 assertions. `bun run lint` remains blocked because ESLint has no repo config file.
Handoff run:      2026-05-15 — `bun run handoff` was rerun with DB access; its test phase passed, but the script exited 1 because of unrelated dirty files, `tsc --silent`, missing ESLint config, and schema-validation warnings.
Tooling run:      2026-05-15 — added ESLint config, removed invalid `--silent` forwarding from `scripts/handoff.sh`, ignored `.tmp-home-config/`, and verified `bun run lint`, `bun run typecheck`, and full `bun test` pass.
Correction run:   2026-05-15 — `node --check public/app.js` passed; `bun run typecheck` passed; `bun test tests/integration/api.integration.test.ts` passed with 12 tests / 146 assertions; full `bun test` passed with 46 tests / 2994 assertions; `bun run lint` passed.
```

---

## Next Steps for Incoming Agent

**User direction (2026-05-15)**: before Slice C enhancements, identify and implement missing baseline features inside already-started product areas. Finish feature completeness FIRST, then circle back to browser verification, automated UI tests, and the open `/users/me` investigation. The roadmap below is sequenced; ship each slice end-to-end (API → UI → tests → docs → commit) before starting the next.

1. **Slice C1 — Account lifecycle** (next): change password, export JSON data, delete account.
2. **Slice C2 — Strategy content verification**: confirm seeded scenarios + evaluator against a reference basic-strategy chart.
3. **Slice C — Session limits + break mode**: per-session loss/time limits, reflection prompt, break-mode lockout.
4. **Slice D — Mood × result analytics**: aggregation endpoint + dashboard widget.
5. **Slice E — Trainer depth**: count drills, deviation drills, difficulty slider.
6. **Slice F — Learning baseline**: minimal Learn hub, lessons, flashcards, and quiz foundation if the product should prioritize learning depth before analytics polish.

After all slices land:
- Browser-verify the auth + dashboard UX hardening at 375 / 768 / 1280 px.
- Add Playwright/Cypress smoke for login → dashboard + unit tests for the password/email validators (extract from `app.js` first).
- Investigate `/users/me` non-2xx-on-fresh-register edge case.
- Decide whether to split `tests/integration/api.integration.test.ts` into per-feature files.

---

## Important Notes

<!-- Anything the next agent needs to know that isn't captured elsewhere -->
- Shared skill setup is documented in `SKILLS.md`. `~/.agents/skills` is the canonical shared third-party skill store; `~/.codex/skills/.system` is reserved for Codex system skills.
- Money remains integer cents everywhere in the API and DB.
- Strategy scenarios are seeded from the same lookup tables used for runtime evaluation to avoid drift.
- The user explicitly wants the original prototype/frontend preserved as reference while the real web app is built separately.
- Integration coverage now exists in one end-to-end API test file, but unit coverage is still missing and the suite depends on a migrated local Postgres database.
- Work should be delivered in smaller chunks with regular git checkpoints and markdown updates.
- Trainer progress now uses real measured response time from scenario load until answer submission.
- Trainer progress now includes `currentStreak`, `bestStreak`, and `recentMistakes`, and the UI can reload a missed scenario by ID for review.
- Dashboard shortcuts now explicitly load the active session before opening the hand logger to avoid logging against stale selection state.
- Core docs are now aligned to the real app; the biggest remaining gaps are product depth and polish rather than documentation drift.
- `/users/me/stats` now supports `period=all|year|month|week` and returns `topCasinos`, session outcome summaries, and average session net.
- `/users/me/budget` computes current-month net loss server-side; budget state is visual only and does not block session creation yet.
