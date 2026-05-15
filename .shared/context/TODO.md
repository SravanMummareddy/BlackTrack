# TODO — BlackStack

---

## Feature Completion Roadmap (active, sequenced)

We are in development phase. Ship every slice end-to-end (schema → API → UI → seed/tests) before moving on. Polish, automation tests, and browser verification come AFTER feature completeness.

1. **Slice A — Session metadata** (in progress next)
   - Tags on sessions (predefined chips + free-form)
   - Pre-session mood (1–5) and post-session mood on completion
   - Completion notes textarea on session-complete modal
   - Surfaced in session detail + dashboard
2. **Slice B — Budget ring (responsible play)**
   - Monthly budget setting on user profile
   - `% used`, `days left`, `net P/L` computed server-side from sessions in the current month
   - Dashboard ring widget + warning state when nearing/over budget
3. **Slice C — Session limits + break mode**
   - Per-session loss limit, time limit (set at session create)
   - Reflection prompt when limits are hit; option to end or extend
   - 24h / 7d / 30d break mode that blocks new session creation
4. **Slice D — Mood × result analytics**
   - Aggregation endpoint returning sessions grouped by mood bucket with net P/L and win rate
   - Dashboard scatter / grouped-bar widget
5. **Slice E — Trainer depth**
   - Count-drill scenarios (running count / true count)
   - Strategy-deviation scenarios (illustrious 18)
   - Difficulty slider in trainer
6. **Slice F — Profile / account management**
   - Change password, export data (JSON), delete account
7. **Slice G — Strategy content verification**
   - Confirm seeded scenarios + evaluator against reference basic-strategy chart

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
- [ ] **Strategy content verification** — Confirm seeded scenarios and evaluator outputs against a reference basic-strategy chart
- [x] **Docs/API reference** — Write or refresh endpoint-level docs under `docs/`
- [x] **Docs template cleanup** — Rewrite architecture, database, deployment, runbook, and style-guide docs around the real app
- [ ] **Docs + verification slice** — Add a stronger manual smoke-test pass and document it

## Medium Priority

- [ ] **Git checkpoints** — Commit after each completed vertical slice with clear messages
- [ ] **MD handoff cadence** — Refresh `.shared/context/*.md` and key docs after each milestone
- [ ] **Budget ring logic** — Monthly budget setting per user; `% used`, `days left`, `net P/L` computed server-side
- [ ] **Mood × result data** — Store pre/post session mood; expose in analytics for scatter chart
- [ ] **Tags system** — Predefined tags (disciplined, tilted, chasing, lucky) + free-form notes on sessions

## Low Priority

- [ ] **Flashcard data model** — Cards linked to basic strategy rules; track which cards a user has mastered
- [ ] **Quiz system** — Scored quizzes linked to lesson content
- [ ] **Lessons content** — Structured course outline for blackjack fundamentals
- [ ] **Mistakes queue** — Trainer wrong answers feed a review queue; resurface spaced-repetition style
- [ ] **Responsible gambling limits** — Per-session loss/time limit settings with reflection prompt trigger
- [ ] **Break mode** — 24h / 7d / 30d breaks stored and enforced on session creation

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
- [x] Session-level hand stats
- [x] Responsive session workspace in the web app
- [ ] Tags + mood

### Phase 3 — Analytics
- [x] Overall bankroll stats endpoint
- [x] Dashboard shell + responsive overview UI in the web app
- [x] Period-based stats
- [ ] Budget ring computation
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
- [ ] Budget settings
- [ ] Session limits
- [ ] Break mode

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
