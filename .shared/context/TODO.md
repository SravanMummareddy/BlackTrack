# TODO — BlackStack

---

## High Priority

- [x] **Responsive web app shell** — Make `/` load a stable, working desktop/mobile web interface from `public/`
- [x] **Auth + dashboard slice** — Sign in/register, load `/users/me`, `/users/me/stats`, and render a working landing dashboard
- [x] **Sessions workspace slice** — Create session, list sessions, session detail, complete session, and hand logging
- [ ] **Trainer workspace slice** — Random scenario, attempt submission, progress panel, chart/reference view
- [ ] **API tests** — Add integration coverage for auth, sessions, hands, user stats, and strategy endpoints
- [ ] **Strategy content verification** — Confirm seeded scenarios and evaluator outputs against a reference basic-strategy chart
- [ ] **Docs/API reference** — Write or refresh endpoint-level docs under `docs/`

## Medium Priority

- [ ] **Git checkpoints** — Commit after each completed vertical slice with clear messages
- [ ] **MD handoff cadence** — Refresh `.shared/context/*.md` and key docs after each milestone
- [ ] **Analytics aggregations** — Period-based (Week/Month/Year/All) P/L, W/L count, avg per session, and per-casino breakdowns
- [ ] **Budget ring logic** — Monthly budget setting per user; `% used`, `days left`, `net P/L` computed server-side
- [ ] **Mood × result data** — Store pre/post session mood; expose in analytics for scatter chart
- [ ] **Tags system** — Predefined tags (disciplined, tilted, chasing, lucky) + free-form notes on sessions
- [ ] **Strategy progression features** — Streaks, mistakes queue, and review resurfacing

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
- [ ] Dashboard + analytics UI in the web app
- [ ] Period-based stats
- [ ] Budget ring computation
- [ ] Mood × result aggregation
- [ ] Per-casino breakdown

### Phase 4 — Learn Core
- [x] Basic strategy engine ported to `src/services/strategy-service.ts`
- [x] Strategy scenario/progress API
- [ ] Responsive trainer UI in the web app
- [ ] Streak + accuracy tracking
- [ ] Mistakes queue

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
