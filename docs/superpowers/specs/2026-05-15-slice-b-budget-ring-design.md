# Slice B — Budget Ring (Responsible Play)

**Date:** 2026-05-15
**Status:** Approved design, ready for implementation plan
**Scope:** Monthly net-loss budget with historical accuracy, dashboard ring widget, visual warning only.

## Goal

Give the user a monthly **net-loss cap** they can set and adjust over time. The dashboard shows how much of the current month's budget has been "used" (net losses), classifies the state (ok / caution / over), and surfaces a visual warning when nearing or exceeding the cap. No hard enforcement in this slice — behavioral blocks belong to Slice C.

## Semantics

- **Budget = monthly net-loss cap.** Wins offset losses.
- For month *M*, given completed sessions in *M*:
  - `netResultCents = Σ(cashOut - buyIn)` across sessions with `status = COMPLETED` AND `endedAt` in *M* (UTC).
  - `lossUsedCents = max(0, -netResultCents)`
  - `percentUsed = round(lossUsedCents / budgetCents * 100)` (integer; can exceed 100)
  - State: `ok` if `<75`, `caution` if `75–99`, `over` if `≥100`.
  - `daysLeftInMonth = days remaining in the current UTC month, inclusive of today.`
- Sessions still ACTIVE do not count toward usage. Only COMPLETED sessions with a `cashOut` value contribute.

## Data Model

New Prisma model:

```prisma
model BudgetSetting {
  id            String   @id @default(uuid())
  userId        String
  amountCents   Int
  effectiveFrom DateTime
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, effectiveFrom])
  @@index([userId, effectiveFrom])
}
```

Relation added on `User`:

```prisma
budgetSettings BudgetSetting[]
```

Constraints:
- `amountCents` is a positive integer (≥ 100, i.e. ≥ $1).
- `effectiveFrom` MUST be the first day of a month, UTC, at 00:00:00. Enforced at API layer.
- Unique per `(userId, effectiveFrom)`; setting the budget for an existing month upserts.

### Resolution rule

For any month *M* (represented as first-of-month UTC), the effective budget for *M* is the row with the greatest `effectiveFrom` such that `effectiveFrom ≤ M` for that user. If no row qualifies, the user has no budget for *M*.

Migration: `prisma/migrations/<timestamp>_budget_setting/migration.sql` creates the table and FK.

## API

All endpoints require authentication. Mounted under `/users/me/budget` via a new router in `src/api/budget.ts`, included from `src/api/index.ts`.

### `GET /users/me/budget`

Returns the current-month view.

Response 200:
```json
{
  "month": "2026-05",
  "budgetCents": 50000,
  "effectiveFrom": "2026-05-01T00:00:00.000Z",
  "netResultCents": -23000,
  "lossUsedCents": 23000,
  "percentUsed": 46,
  "state": "caution",
  "daysLeftInMonth": 16
}
```

If no effective budget exists for the current month, `budgetCents`, `effectiveFrom`, `percentUsed`, `state` are `null`; `netResultCents`, `lossUsedCents`, `daysLeftInMonth` are still computed.

### `PUT /users/me/budget`

Upsert a `BudgetSetting`. Idempotent on `(userId, effectiveFrom)`.

Request:
```json
{ "amountCents": 50000, "effectiveFrom": "2026-06-01" }
```

- `effectiveFrom` is optional. When omitted, defaults to the first day of the current UTC month.
- `effectiveFrom` must parse to a UTC instant where `day === 1`, `hour/min/sec/ms === 0`.
- `effectiveFrom` must be ≥ `User.createdAt`'s month-start (no retroactively setting budgets before the account existed).
- `amountCents` is a positive integer ≥ 100.

Response 200: the upserted `BudgetSetting` row.

Validation errors → 400 with field-level messages.

### `GET /users/me/budget/history`

Returns the user's `BudgetSetting` rows ordered by `effectiveFrom` DESC. Small list; no pagination needed in this slice.

## Service Layer

New module `src/services/budget-service.ts`. Pure functions plus DB-accessing functions.

Pure helpers (unit-testable without DB):
- `monthStartUtc(date: Date): Date` — returns first-of-month at 00:00 UTC.
- `daysLeftInMonth(now: Date): number`
- `computePercentUsed(lossUsedCents: number, budgetCents: number | null): number | null`
- `classifyState(percentUsed: number | null): 'ok' | 'caution' | 'over' | null`
- `resolveEffectiveBudget(settings: BudgetSetting[], monthStart: Date): BudgetSetting | null` — operates over an already-fetched list (so callers can batch the query).

DB-touching functions:
- `getMonthlyBudgetView(userId: string, now = new Date()): Promise<BudgetView>` — fetches all settings for the user (small, capped in practice), resolves effective budget for current month, aggregates completed sessions for current month, assembles payload.
- `setBudget(userId: string, amountCents: number, effectiveFrom: Date): Promise<BudgetSetting>` — upsert via Prisma.
- `listBudgetHistory(userId: string): Promise<BudgetSetting[]>`

Aggregation query for net result uses a single `prisma.casinoSession.findMany` or `aggregate` filtered by `userId`, `status: COMPLETED`, `endedAt` in `[monthStart, nextMonthStart)`, `cashOut: { not: null }`.

## UI

Frontend lives in `public/` (vanilla JS, existing pattern).

### Dashboard ring card

Added to the dashboard view. Layout:

```
+-----------------------------+
|  Monthly Budget             |
|                             |
|        ⭕ 46%               |
|     $230 / $500             |
|                             |
|  Net P/L  -$230             |
|  16 days left               |
+-----------------------------+
|  [ Edit budget ]            |
+-----------------------------+
```

- SVG ring with `stroke-dasharray` driven by `percentUsed` (capped visually at 100% even when over).
- Class on the card root: `budget-ring--ok | budget-ring--caution | budget-ring--over` mapped from `state`.
- When `state === 'over'`, an inline warning row appears: "You're over your monthly budget."
- When no budget is set, the card shows a "Set a monthly budget" empty state with an inline amount input and Save button → calls `PUT /users/me/budget`.
- "Edit budget" reveals the same inline form prefilled with the current `budgetCents`.

### Styling

Three state colors, reusing existing accent / amber / danger tokens from the design system. New CSS in `public/styles.css` for the ring card; no new global tokens.

### Data flow

- Dashboard load fetches `GET /users/me/budget` alongside existing `/users/me/stats`.
- Saving the budget triggers an optimistic refetch.

## Testing

**Unit (Bun test, no DB):**
- `monthStartUtc` across timezones at month boundaries (e.g., last-second-of-month inputs).
- `daysLeftInMonth` for first/middle/last day of month, including a leap-Feb date.
- `computePercentUsed` for zero, partial, exact, over, and `budgetCents = null`.
- `classifyState` boundaries: 0, 74, 75, 99, 100, 200, null.
- `resolveEffectiveBudget` over a synthetic list spanning multiple months.

**Integration (existing `tests/integration/api.integration.test.ts` pattern):**
- `PUT` then `GET` round-trips the new budget.
- Seeding completed sessions with known buy-in/cash-out yields the expected `netResultCents`, `percentUsed`, `state`.
- Updating the budget mid-history: old months still resolve to the older row; new months resolve to the new row.
- `PUT` rejects non-month-start `effectiveFrom`, negative or zero `amountCents`.
- `GET /history` returns rows in DESC order.

## Out of Scope (deferred)

- Hard blocks on session creation when over budget → **Slice C**.
- Per-session loss/time limits, reflection prompts → **Slice C**.
- 24h / 7d / 30d break mode → **Slice C**.
- Notifications/emails when crossing thresholds.
- Mood × result analytics → **Slice D**.

## Files Touched (anticipated)

- `prisma/schema.prisma` — add `BudgetSetting` model and `User.budgetSettings` relation
- `prisma/migrations/<ts>_budget_setting/migration.sql`
- `src/services/budget-service.ts` (new)
- `src/api/budget.ts` (new)
- `src/api/index.ts` — mount router
- `public/app.js` — fetch + render budget card, handle form submit
- `public/styles.css` — ring card styles + state modifiers
- `public/index.html` — card placeholder if needed
- `tests/unit/budget-service.test.ts` (new)
- `tests/integration/api.integration.test.ts` — extend
- `docs/API.md` — document new endpoints
- `.shared/context/CONTEXT.md`, `.shared/context/TODO.md` — mark Slice B complete on land
