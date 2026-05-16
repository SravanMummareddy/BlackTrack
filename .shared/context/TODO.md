# TODO — BlackStack

> **Current state (2026-05-15 PM):** Slices B, C0, C1, C2, C, D, and **E** shipped on `main`. 13 of 16 UX/flow audit gaps closed (added: trainer chart now served by API; reference chart lives in `src/services/strategy-chart.ts`). Slice E delivers count drills (Hi-Lo running count), deviation drills (Illustrious 18), and difficulty slider (1/2/3). **Remaining (deferred — need external infra):** password reset + email verification + OAuth (SMTP/provider creds), Sentry (DSN), mistakes-queue UI reconciliation. Next on roadmap: Slice F (Learn hub — lessons, flashcards, quizzes).

---

## Feature Completion Roadmap (active, sequenced)

We are in development phase. Ship every slice end-to-end (schema → API → UI → seed/tests) before moving on. Polish, automation tests, and browser verification come AFTER feature completeness.

1. **Slice B — Budget ring (responsible play)** (complete)
   - Monthly budget setting on user profile
   - `% used`, `days left`, `net P/L` computed server-side from sessions in the current month
   - Dashboard ring widget + warning state when nearing/over budget
2. **Slice C0 — Baseline correction features** (complete)
   - Edit and delete hand logs
   - Edit, delete, and reopen sessions
   - Active-session live P/L computed from logged hand payouts
3. **Slice C1 — Account lifecycle** (complete)
   - Change password
   - Export account/session/hand/trainer data as JSON
   - Delete account with cascade cleanup
4. **Slice C2 — Strategy content verification** (complete)
   - Independent reference basic-strategy chart locked down in `tests/unit/strategy-reference-chart.test.ts`
   - Every seeded scenario asserted cell-by-cell vs the reference (350 cells)
   - Named high-risk hard/soft/pair decisions covered as focused tests
   - Evaluator agrees end-to-end with reference for every seed scenario
5. **Slice C — Session limits + break mode** (complete — API/service)
   - `lossLimitCents` + `timeLimitMinutes` set on session create, patchable later
   - Computed `limitState` returned on every session payload (drives reflection prompt client-side)
   - `GET/PUT/DELETE /users/me/break` with 24h / 7d / 30d durations; `breakUntil` blocks new session creation (403)
   - Unit + integration coverage added; UI surface not yet wired
6. **Slice D — Mood × result analytics** (complete)
   - `GET /users/me/mood-analytics?bucket=start|end&period=...` returning sessions grouped by mood bucket with net P/L, win rate, ROI, hand win rate
   - Dashboard "Mood × Result" card with start/end toggle
   - Integration test asserts buckets and bucket switching
7. **Slice E — Trainer depth** (complete — 2026-05-15)
   - Count-drill scenarios (Hi-Lo running count); `GET /strategy/count-drill`
   - Strategy-deviation scenarios (Illustrious 18); `GET /strategy/deviations`
   - Difficulty slider in trainer (any / 1 / 2 / 3) using existing `?difficulty=N`
8. **Slice F — Learning baseline**
   - Learn hub with lesson, flashcard, and quiz foundation

Each slice ends with: typecheck pass, integration test added or updated, commit, doc refresh.

---

## UX / Flow Fixes (from 2026-05-15 user-flow audit)

- [x] **Edit limits mid-session** — `lossLimitCents` + `timeLimitMinutes` fields added to `renderSessionEditForm`; payload sends null-clearing semantics — 2026-05-15
- [x] **Limit banner in session detail** — `renderLimitReflection` now also renders inside the session-detail card — 2026-05-15
- [x] **Live limit ticking** — 30s `setInterval` recomputes `elapsedMinutes` client-side on active sessions and re-renders when it changes — 2026-05-15
- [x] **Limit-crossing toast** — `detectLimitCrossing` fires a warning notice on rising-edge `anyLimitHit` flips — 2026-05-15
- [x] **Break-aware create modal** — Session-create form shows "On break until X" banner and disables submit when `breakState.active` — 2026-05-15
- [x] **Mood analytics period filter** — `period` tabs (all/year/month/week) added to Mood × Result card and threaded through `loadMoodAnalytics` — 2026-05-15
- [x] **Budget history view** — Collapsible Budget History card in Profile view; loads `GET /users/me/budget/history` on first open — 2026-05-15
- [x] **Sessions pagination UI** — `pageSize=20` initial fetch + "Load more" button appends pages while `sessionsHasMore` is true — 2026-05-15
- [x] **Multiple active sessions** — Sessions workspace surfaces a warning when >1 session is `ACTIVE` — 2026-05-15
- [ ] **Password reset / forgot-password flow** — Requires SMTP/email provider; deferred until provider chosen
- [ ] **Email verification** — Requires SMTP/email provider; deferred
- [ ] **OAuth login wiring** — Requires provider credentials (Google/GitHub); deferred
- [x] **Trainer chart from API** — Reference chart extracted to `src/services/strategy-chart.ts`; served via public `GET /strategy/chart`; client fetches lazily — 2026-05-15
- [ ] **Mistakes queue UI visibility** — Reconcile TODO inconsistency; surface resurfacing in trainer
- [x] **E2E test suite** — Playwright config + smoke spec scaffolded under `tests/e2e/` (landing render, `/healthz`, guest mode); install with `bun add -d @playwright/test` — 2026-05-15
- [x] **CI pipeline** — `.github/workflows/ci.yml` already runs typecheck + tests on push/PR (pre-existing) — 2026-05-15
- [x] **Health endpoint** — `GET /healthz` added in `src/app.ts` with integration test coverage; Sentry/error-tracking SDK deferred (needs DSN) — 2026-05-15

## High Priority

- [x] **Responsive web app shell** — Make `/` load a stable, working desktop/mobile web interface from `public/`
- [x] **Auth + dashboard slice** — Sign in/register, load `/users/me`, `/users/me/stats`, and render a working landing dashboard
- [x] **Sessions workspace slice** — Create session, list sessions, session detail, complete session, and hand logging
- [x] **Trainer workspace slice** — Random scenario, attempt submission, progress panel, chart/reference view
- [x] **Responsive polish slice** — Improve desktop/tablet layout, dashboard hierarchy, and trainer/session fit-and-finish
- [x] **API tests** — Add integration coverage for auth, sessions, hands, user stats, and strategy endpoints
- [x] **Analytics aggregations** — Period-based stats and per-casino dashboard breakdowns
- [x] **Strategy progression features** — Streaks and review resurfacing
- [x] **Session metadata** — Tags, pre/post session mood, and completion notes in API + web app
- [x] **Baseline correction features** — Edit/delete hands, edit/delete/reopen sessions, and show active-session live P/L
- [x] **Account lifecycle** — Change password, export JSON, and delete account
- [x] **Strategy content verification** — Seeded scenarios and evaluator outputs locked against an independent reference basic-strategy chart
- [x] **Docs/API reference** — Write or refresh endpoint-level docs under `docs/`
- [x] **Docs template cleanup** — Rewrite architecture, database, deployment, runbook, and style-guide docs around the real app
- [x] **Docs + verification slice** — Manual smoke-test documented at `docs/SMOKE_TEST.md`

## Medium Priority

- [x] **Git checkpoints** — Current completed vertical slices have clear checkpoint commits
- [x] **MD handoff cadence** — `.shared/context/*.md` and key docs refreshed after the Slice B milestone
- [x] **Budget ring logic** — Monthly budget setting per user; `% used`, `days left`, `net P/L` computed server-side
- [x] **Mood × result analytics** — `/users/me/mood-analytics` endpoint + dashboard widget
- [x] **Session limits + break mode UI** — Reflection banner on active session focus card; break controls in profile

## Low Priority

- [ ] **Flashcard data model** — Cards linked to basic strategy rules; track which cards a user has mastered
- [ ] **Quiz system** — Scored quizzes linked to lesson content
- [ ] **Lessons content** — Structured course outline for blackjack fundamentals
- [ ] **Mistakes queue** — Trainer wrong answers feed a review queue; resurface spaced-repetition style
- [x] **Responsible gambling limits** — Per-session loss/time limit settings with reflection prompt trigger (API/service)
- [x] **Break mode** — 24h / 7d / 30d breaks stored and enforced on session creation (API/service)

---

## Blockers

| # | Description | Blocked By | Impact | Status |
|---|---|---|---|---|
| 1 | No active blockers | — | Low | Closed |

---

## By Phase

### Phase 1 — Data Layer
- [x] Prisma schema for auth, sessions, hands, and strategy
- [x] DB migrations
- [x] Strategy scenario seed script

### Phase 2 — Track Core
- [x] Session CRUD
- [x] Hand logging nested under sessions
- [x] Hand edit/delete correction flow
- [x] Session edit/delete/reopen UI flow
- [x] Active-session live P/L
- [x] Session-level hand stats
- [x] Responsive session workspace in the web app
- [x] Tags + mood

### Phase 3 — Analytics
- [x] Overall bankroll stats endpoint
- [x] Dashboard shell + responsive overview UI in the web app
- [x] Period-based stats
- [x] Budget ring computation
- [x] Mood × result aggregation
- [x] Per-casino breakdown

### Phase 4 — Learn Core
- [x] Basic strategy engine ported to `src/services/strategy-service.ts`
- [x] Strategy scenario/progress API
- [x] Responsive trainer UI in the web app
- [x] Trainer chart/reference polish
- [x] Streak + accuracy tracking
- [x] Mistakes queue

### Phase 5 — Responsible Gambling
- [x] Budget settings
- [x] Session limits (API/service)
- [x] Break mode (API/service)

---

## Completed

- [x] Project skeleton (src/, tests/, scripts/, docker/, docs/, .shared/) — 2026-05-14
- [x] Design artifacts organized into design/ folder — 2026-05-14
- [x] HTML entry points updated with correct relative paths — 2026-05-14
- [x] Sessions API + nested hands API wired in `src/api/index.ts` — 2026-05-14
- [x] `GET /users/me/stats` implemented — 2026-05-14
- [x] Strategy service, API routes, and seed script implemented — 2026-05-14
- [x] Prototype restored as visual/interaction reference after reverting API-coupled experiment — 2026-05-14
- [x] Real web app scaffold started under `public/` and served by Express — 2026-05-14
- [x] Chunk 1 complete: `/` serves, auth shell works, and auth endpoints were validated live — 2026-05-14
- [x] Chunk 2 complete: session workspace flows validated against the live API — 2026-05-14
- [x] Chunk 3 complete: trainer interaction flow validated against the live API — 2026-05-14
- [x] Chunk 4 complete: responsive dashboard/trainer polish landed in the web app — 2026-05-14
- [x] Docs slice complete: README and API reference refreshed for the live product — 2026-05-14
- [x] Integration test slice complete: baseline API coverage added with Supertest + Bun — 2026-05-14
- [x] Docs cleanup slice complete: template-heavy docs rewritten for the real app — 2026-05-14
- [x] Analytics slice complete: period stats and casino breakdowns added to backend and dashboard — 2026-05-14
- [x] Strategy progression slice complete: streaks and missed-hand review added to backend and trainer UI — 2026-05-14
- [x] Session metadata slice complete: tags, pre/post mood, completion notes, API docs, and integration assertions added — 2026-05-15
- [x] Slice B budget ring complete: monthly budget settings, computed current-month budget view, dashboard ring widget, API docs, unit tests, and integration tests — 2026-05-15
- [x] Slice B merge handoff complete: shared context refreshed for merge/push and next slice set to session limits + break mode — 2026-05-15
- [x] Slice C0 baseline correction complete: hand edit/delete, session edit/delete/reopen, live active-session P/L, API docs, and integration coverage — 2026-05-15
- [x] Slice C1 account lifecycle complete: password change, credential-safe JSON export, delete account cascade, profile UI controls, API docs, and integration coverage — 2026-05-15
- [x] Slice C2 strategy content verification complete: independent reference chart, 350-cell coverage, high-risk decision suite, evaluator agreement — 2026-05-15
- [x] Slice C session limits + break mode complete (API/service): per-session loss/time limits, computed limitState, 24h/7d/30d break blocking session creation, unit + integration coverage — 2026-05-15
- [x] Slice D mood × result analytics complete: aggregation endpoint with start/end bucket toggle, dashboard widget, integration coverage — 2026-05-15
- [x] Session limits + break mode UI complete: loss/time limit fields on session create, live reflection banner on dashboard focus card, break controls in profile — 2026-05-15
- [x] Manual smoke-test documented at `docs/SMOKE_TEST.md` — 2026-05-15
