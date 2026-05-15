# TODO — BlackStack

> **Current state (2026-05-15):** Slices B, C0, C1, C2, and C (API/service) shipped on `main`. Next up: Slice D — Mood × result analytics. Outstanding UI follow-up: wire session-limits reflection prompt + break-mode controls into `public/`.

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
6. **Slice D — Mood × result analytics**
   - Aggregation endpoint returning sessions grouped by mood bucket with net P/L and win rate
   - Dashboard scatter / grouped-bar widget
7. **Slice E — Trainer depth**
   - Count-drill scenarios (running count / true count)
   - Strategy-deviation scenarios (illustrious 18)
   - Difficulty slider in trainer
8. **Slice F — Learning baseline**
   - Learn hub with lesson, flashcard, and quiz foundation

Each slice ends with: typecheck pass, integration test added or updated, commit, doc refresh.

---

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
- [ ] **Docs + verification slice** — Add a stronger manual smoke-test pass and document it

## Medium Priority

- [x] **Git checkpoints** — Current completed vertical slices have clear checkpoint commits
- [x] **MD handoff cadence** — `.shared/context/*.md` and key docs refreshed after the Slice B milestone
- [x] **Budget ring logic** — Monthly budget setting per user; `% used`, `days left`, `net P/L` computed server-side
- [ ] **Mood × result analytics** — Aggregate stored pre/post session mood for dashboard insight
- [ ] **Session limits + break mode UI** — Surface `limitState` reflection prompt and `/users/me/break` controls in `public/` (API/service already shipped)

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
- [ ] Mood × result aggregation
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
