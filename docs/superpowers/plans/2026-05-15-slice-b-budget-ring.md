# Slice B — Budget Ring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-ready monthly net-loss budget feature with a history-aware data model, a server-side computed dashboard view, and a visual ring widget.

**Architecture:** New `BudgetSetting` Prisma table keyed on `(userId, effectiveFrom)` for historical accuracy. A pure-function service layer (`budget-service.ts`) does month resolution + aggregation. A new Express router under `/users/me/budget` exposes `GET`, `PUT`, and `GET /history`. Vanilla-JS dashboard renders an SVG ring with three states (ok/caution/over) using safe DOM APIs (no `innerHTML`), plus an inline edit form.

**Tech Stack:** Prisma + PostgreSQL, Express + Zod, Bun test, vanilla JS/CSS.

**Spec:** `docs/superpowers/specs/2026-05-15-slice-b-budget-ring-design.md`

---

## File Structure

- **Create:** `src/services/budget-service.ts` — pure helpers + DB-touching service functions
- **Create:** `src/api/budget.ts` — Express router for `/users/me/budget` endpoints
- **Create:** `prisma/migrations/<ts>_budget_setting/migration.sql` — new table
- **Create:** `tests/unit/budget-service.test.ts` — math + resolver unit tests
- **Modify:** `prisma/schema.prisma` — `BudgetSetting` model + `User.budgetSettings` relation
- **Modify:** `src/api/index.ts` — mount budget router under `/users`
- **Modify:** `tests/integration/api.integration.test.ts` — add budget round-trip tests
- **Modify:** `public/index.html` — pre-rendered card skeleton with stable element IDs
- **Modify:** `public/app.js` — fetch and update the card via `textContent` + `setAttribute`
- **Modify:** `public/styles.css` — ring + state styles
- **Modify:** `docs/API.md` — document new endpoints
- **Modify:** `.shared/context/CONTEXT.md`, `.shared/context/TODO.md` — mark Slice B done at land time

---

### Task 1: Add `BudgetSetting` schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_budget_setting/migration.sql`

- [ ] **Step 1: Add the model and relation in `prisma/schema.prisma`**

Inside the `User` model, add to the relations block:

```prisma
budgetSettings BudgetSetting[]
```

After `CasinoSession`, add:

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

- [ ] **Step 2: Create migration**

Run:

```bash
bunx prisma migrate dev --name budget_setting
```

Expected: new directory under `prisma/migrations/` with `migration.sql` containing `CREATE TABLE "BudgetSetting"`, unique index, FK to `User(id) ON DELETE CASCADE`.

- [ ] **Step 3: Regenerate client**

Run:

```bash
bunx prisma generate
```

- [ ] **Step 4: Typecheck**

Run:

```bash
bunx tsc --noEmit
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add BudgetSetting model for monthly net-loss budgets"
```

---

### Task 2: Pure helpers — month math + state classification

**Files:**
- Create: `src/services/budget-service.ts`
- Create: `tests/unit/budget-service.test.ts`

- [ ] **Step 1: Write failing unit tests**

Create `tests/unit/budget-service.test.ts`:

```ts
import { describe, expect, test } from 'bun:test';
import {
  monthStartUtc,
  daysLeftInMonth,
  computePercentUsed,
  classifyState,
} from '../../src/services/budget-service';

describe('monthStartUtc', () => {
  test('returns first of month at 00:00 UTC', () => {
    expect(monthStartUtc(new Date('2026-05-15T18:30:00Z')).toISOString())
      .toBe('2026-05-01T00:00:00.000Z');
  });
  test('handles last second of month', () => {
    expect(monthStartUtc(new Date('2026-05-31T23:59:59.999Z')).toISOString())
      .toBe('2026-05-01T00:00:00.000Z');
  });
});

describe('daysLeftInMonth', () => {
  test('first of month returns full length', () => {
    expect(daysLeftInMonth(new Date('2026-05-01T00:00:00Z'))).toBe(31);
  });
  test('mid-month returns remaining (inclusive)', () => {
    expect(daysLeftInMonth(new Date('2026-05-15T12:00:00Z'))).toBe(17);
  });
  test('last day of month returns 1', () => {
    expect(daysLeftInMonth(new Date('2026-05-31T23:59:59Z'))).toBe(1);
  });
  test('leap February', () => {
    expect(daysLeftInMonth(new Date('2028-02-01T00:00:00Z'))).toBe(29);
  });
});

describe('computePercentUsed', () => {
  test('null budget returns null', () => {
    expect(computePercentUsed(1000, null)).toBe(null);
  });
  test('zero usage', () => {
    expect(computePercentUsed(0, 50000)).toBe(0);
  });
  test('partial usage rounds', () => {
    expect(computePercentUsed(23000, 50000)).toBe(46);
  });
  test('exact 100', () => {
    expect(computePercentUsed(50000, 50000)).toBe(100);
  });
  test('over 100 is uncapped', () => {
    expect(computePercentUsed(75000, 50000)).toBe(150);
  });
});

describe('classifyState', () => {
  test('null percent', () => { expect(classifyState(null)).toBe(null); });
  test('boundaries', () => {
    expect(classifyState(0)).toBe('ok');
    expect(classifyState(74)).toBe('ok');
    expect(classifyState(75)).toBe('caution');
    expect(classifyState(99)).toBe('caution');
    expect(classifyState(100)).toBe('over');
    expect(classifyState(200)).toBe('over');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
bun test tests/unit/budget-service.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement helpers**

Create `src/services/budget-service.ts`:

```ts
export type BudgetState = 'ok' | 'caution' | 'over';

export function monthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function nextMonthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function daysLeftInMonth(now: Date): number {
  const end = nextMonthStartUtc(now);
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const ms = end.getTime() - startOfToday.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}

export function computePercentUsed(
  lossUsedCents: number,
  budgetCents: number | null
): number | null {
  if (budgetCents === null || budgetCents <= 0) return null;
  return Math.round((lossUsedCents / budgetCents) * 100);
}

export function classifyState(percentUsed: number | null): BudgetState | null {
  if (percentUsed === null) return null;
  if (percentUsed >= 100) return 'over';
  if (percentUsed >= 75) return 'caution';
  return 'ok';
}
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
bun test tests/unit/budget-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/budget-service.ts tests/unit/budget-service.test.ts
git commit -m "feat(budget): add pure helpers for month math and state classification"
```

---

### Task 3: Effective-budget resolver

**Files:**
- Modify: `src/services/budget-service.ts`
- Modify: `tests/unit/budget-service.test.ts`

- [ ] **Step 1: Append failing tests**

Append to `tests/unit/budget-service.test.ts`:

```ts
import { resolveEffectiveBudget } from '../../src/services/budget-service';

describe('resolveEffectiveBudget', () => {
  const settings = [
    { id: 'a', userId: 'u', amountCents: 30000, effectiveFrom: new Date('2026-01-01T00:00:00Z'), createdAt: new Date() },
    { id: 'b', userId: 'u', amountCents: 50000, effectiveFrom: new Date('2026-04-01T00:00:00Z'), createdAt: new Date() },
    { id: 'c', userId: 'u', amountCents: 70000, effectiveFrom: new Date('2026-07-01T00:00:00Z'), createdAt: new Date() },
  ];

  test('null when nothing applies', () => {
    expect(resolveEffectiveBudget(settings, new Date('2025-12-01T00:00:00Z'))).toBe(null);
  });
  test('latest setting on/before target month', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-05-01T00:00:00Z'))?.amountCents).toBe(50000);
  });
  test('exact match', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-04-01T00:00:00Z'))?.amountCents).toBe(50000);
  });
  test('future months use most recent past row', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-09-01T00:00:00Z'))?.amountCents).toBe(70000);
  });
  test('empty list', () => {
    expect(resolveEffectiveBudget([], new Date('2026-05-01T00:00:00Z'))).toBe(null);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
bun test tests/unit/budget-service.test.ts
```

Expected: FAIL — `resolveEffectiveBudget` not exported.

- [ ] **Step 3: Implement**

Append to `src/services/budget-service.ts`:

```ts
export interface BudgetSettingRow {
  id: string;
  userId: string;
  amountCents: number;
  effectiveFrom: Date;
  createdAt: Date;
}

export function resolveEffectiveBudget(
  settings: BudgetSettingRow[],
  monthStart: Date
): BudgetSettingRow | null {
  let best: BudgetSettingRow | null = null;
  for (const s of settings) {
    if (s.effectiveFrom.getTime() <= monthStart.getTime()) {
      if (!best || s.effectiveFrom.getTime() > best.effectiveFrom.getTime()) best = s;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run to verify pass**

```bash
bun test tests/unit/budget-service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/budget-service.ts tests/unit/budget-service.test.ts
git commit -m "feat(budget): add effective-budget resolver"
```

---

### Task 4: DB-touching service functions

**Files:**
- Modify: `src/services/budget-service.ts`

- [ ] **Step 1: Append service functions**

```ts
import { prisma } from '../database';

export interface MonthlyBudgetView {
  month: string;
  budgetCents: number | null;
  effectiveFrom: string | null;
  netResultCents: number;
  lossUsedCents: number;
  percentUsed: number | null;
  state: BudgetState | null;
  daysLeftInMonth: number;
}

function formatMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function getMonthlyBudgetView(
  userId: string,
  now: Date = new Date()
): Promise<MonthlyBudgetView> {
  const monthStart = monthStartUtc(now);
  const monthEnd = nextMonthStartUtc(monthStart);

  const [settings, sessions] = await Promise.all([
    prisma.budgetSetting.findMany({ where: { userId }, orderBy: { effectiveFrom: 'desc' } }),
    prisma.casinoSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        endedAt: { gte: monthStart, lt: monthEnd },
        cashOut: { not: null },
      },
      select: { buyIn: true, cashOut: true },
    }),
  ]);

  const effective = resolveEffectiveBudget(settings, monthStart);
  const netResultCents = sessions.reduce((sum, s) => sum + ((s.cashOut ?? 0) - s.buyIn), 0);
  const lossUsedCents = Math.max(0, -netResultCents);
  const percentUsed = computePercentUsed(lossUsedCents, effective?.amountCents ?? null);

  return {
    month: formatMonth(monthStart),
    budgetCents: effective?.amountCents ?? null,
    effectiveFrom: effective?.effectiveFrom.toISOString() ?? null,
    netResultCents,
    lossUsedCents,
    percentUsed,
    state: classifyState(percentUsed),
    daysLeftInMonth: daysLeftInMonth(now),
  };
}

export async function setBudget(
  userId: string,
  amountCents: number,
  effectiveFrom: Date
): Promise<BudgetSettingRow> {
  return prisma.budgetSetting.upsert({
    where: { userId_effectiveFrom: { userId, effectiveFrom } },
    update: { amountCents },
    create: { userId, amountCents, effectiveFrom },
  });
}

export async function listBudgetHistory(userId: string): Promise<BudgetSettingRow[]> {
  return prisma.budgetSetting.findMany({
    where: { userId },
    orderBy: { effectiveFrom: 'desc' },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
bunx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/services/budget-service.ts
git commit -m "feat(budget): add monthly view, upsert, and history service functions"
```

---

### Task 5: API router — `GET /users/me/budget`

**Files:**
- Create: `src/api/budget.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Create the router**

Create `src/api/budget.ts`:

```ts
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware';
import { ValidationError } from '../utils/errors';
import {
  getMonthlyBudgetView,
  setBudget,
  listBudgetHistory,
  monthStartUtc,
} from '../services/budget-service';
import { prisma } from '../database';

const router = Router();
router.use(authenticate);

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const details = Object.entries(fieldErrors).flatMap(([field, messages]) =>
      (messages ?? []).map((message) => ({ field, message }))
    );
    throw new ValidationError(details);
  }
  return result.data;
}

router.get('/me/budget', async (req: Request, res: Response) => {
  const view = await getMonthlyBudgetView(req.userId!);
  res.status(200).json({ data: view });
});

export default router;
```

- [ ] **Step 2: Mount in `src/api/index.ts`**

Add import:

```ts
import budgetRouter from './budget';
```

After `apiRouter.use('/users', usersRouter);` add:

```ts
apiRouter.use('/users', budgetRouter);
```

- [ ] **Step 3: Typecheck**

```bash
bunx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/api/budget.ts src/api/index.ts
git commit -m "feat(budget): add GET /users/me/budget endpoint"
```

---

### Task 6: API — `PUT` + history

**Files:**
- Modify: `src/api/budget.ts`

- [ ] **Step 1: Append handlers above `export default router;`**

```ts
const putBudgetSchema = z.object({
  amountCents: z.number().int().min(100, 'Budget must be at least $1'),
  effectiveFrom: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

router.put('/me/budget', async (req: Request, res: Response) => {
  const input = parseBody(putBudgetSchema, req.body);
  const effective = input.effectiveFrom ?? monthStartUtc(new Date());

  if (
    effective.getUTCDate() !== 1 ||
    effective.getUTCHours() !== 0 ||
    effective.getUTCMinutes() !== 0 ||
    effective.getUTCSeconds() !== 0 ||
    effective.getUTCMilliseconds() !== 0
  ) {
    throw new ValidationError([
      { field: 'effectiveFrom', message: 'Must be the first day of a month at 00:00 UTC' },
    ]);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId },
    select: { createdAt: true },
  });
  if (effective.getTime() < monthStartUtc(user.createdAt).getTime()) {
    throw new ValidationError([
      { field: 'effectiveFrom', message: 'Cannot set budget before account creation' },
    ]);
  }

  const row = await setBudget(req.userId!, input.amountCents, effective);
  res.status(200).json({ data: row });
});

router.get('/me/budget/history', async (req: Request, res: Response) => {
  const rows = await listBudgetHistory(req.userId!);
  res.status(200).json({ data: rows });
});
```

- [ ] **Step 2: Typecheck**

```bash
bunx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/api/budget.ts
git commit -m "feat(budget): add PUT and history endpoints with validation"
```

---

### Task 7: Integration tests

**Files:**
- Modify: `tests/integration/api.integration.test.ts`

- [ ] **Step 1: Inspect existing helpers**

```bash
grep -n "describe\|registerAndLogin\|seedCompletedSession\|request(" tests/integration/api.integration.test.ts | head -40
```

If `registerAndLogin` / `seedCompletedSession` helpers don't exist, add them at the top of the test file (next to other helpers). `seedCompletedSession` calls `prisma.casinoSession.create({ data: { userId, casinoName: 'Test', tableMin: 500, tableMax: 50000, decks: 6, buyIn, cashOut, status: 'COMPLETED', endedAt: new Date() }})`.

- [ ] **Step 2: Append new `describe` block**

```ts
describe('budget', () => {
  test('GET returns null budget for new user', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .get('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.budgetCents).toBe(null);
    expect(res.body.data.state).toBe(null);
    expect(typeof res.body.data.daysLeftInMonth).toBe('number');
  });

  test('PUT sets budget for current month; GET reflects it', async () => {
    const { token } = await registerAndLogin();
    const put = await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000 });
    expect(put.status).toBe(200);
    expect(put.body.data.amountCents).toBe(50000);

    const get = await request(app)
      .get('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.data.budgetCents).toBe(50000);
    expect(get.body.data.state).toBe('ok');
    expect(get.body.data.percentUsed).toBe(0);
  });

  test('losing sessions move state to caution then over', async () => {
    const { token, userId } = await registerAndLogin();
    await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000 });

    await seedCompletedSession(userId, { buyIn: 50000, cashOut: 10000 }); // -$400 → 80%
    let get = await request(app)
      .get('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.data.percentUsed).toBe(80);
    expect(get.body.data.state).toBe('caution');

    await seedCompletedSession(userId, { buyIn: 30000, cashOut: 10000 }); // -$200 more → over
    get = await request(app)
      .get('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.data.state).toBe('over');
    expect(get.body.data.percentUsed).toBeGreaterThanOrEqual(100);
  });

  test('PUT rejects amount below $1', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50 });
    expect(res.status).toBe(400);
  });

  test('PUT rejects non-month-start effectiveFrom', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000, effectiveFrom: '2026-05-15T00:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  test('GET /history returns DESC by effectiveFrom', async () => {
    const { token } = await registerAndLogin();
    await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 30000, effectiveFrom: '2026-04-01T00:00:00.000Z' });
    await request(app)
      .put('/api/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000, effectiveFrom: '2026-05-01T00:00:00.000Z' });
    const res = await request(app)
      .get('/api/users/me/budget/history')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].amountCents).toBe(50000);
    expect(res.body.data[1].amountCents).toBe(30000);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
bun test tests/integration/api.integration.test.ts
```

Expected: all budget tests PASS; existing tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/integration/api.integration.test.ts
git commit -m "test(budget): integration coverage for GET/PUT/history and state transitions"
```

---

### Task 8: UI — static card skeleton + styles

The card markup is fully pre-rendered in HTML with stable element IDs. JS only flips `hidden`, sets `data-state`, updates `textContent`, and sets `setAttribute` on the ring's `<circle stroke-dashoffset>`. No `innerHTML` anywhere.

**Files:**
- Modify: `public/index.html`
- Modify: `public/styles.css`

- [ ] **Step 1: Inspect dashboard layout**

```bash
grep -n "dashboard\|stats-card\|view-dashboard" public/index.html | head -20
```

- [ ] **Step 2: Add the pre-rendered card to the dashboard section**

```html
<section class="card budget-card" id="budget-card" data-state="unset" hidden>
  <header class="card__header">
    <h3>Monthly Budget</h3>
    <button type="button" class="link" id="budget-edit-btn" hidden>Edit</button>
  </header>

  <div class="budget-card__body" id="budget-card-body">
    <svg class="budget-ring" id="budget-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="budget-ring__track" cx="50" cy="50" r="42" stroke-width="10" fill="none"></circle>
      <circle
        class="budget-ring__bar"
        id="budget-ring-bar"
        cx="50" cy="50" r="42"
        stroke-width="10" fill="none"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        stroke-dasharray="263.8938"
        stroke-dashoffset="263.8938"
      ></circle>
      <text class="budget-ring__label" id="budget-ring-label" x="50" y="50">—</text>
    </svg>

    <div class="budget-card__figures">
      <span class="primary" id="budget-primary">Set a monthly budget</span>
      <span id="budget-net">—</span>
      <span id="budget-days">—</span>
    </div>
  </div>

  <form class="budget-card__form" id="budget-form" hidden>
    <label for="budget-input">Monthly net-loss cap (USD)</label>
    <input type="number" id="budget-input" min="1" step="1" inputmode="numeric" required />
    <div class="budget-card__actions">
      <button type="submit" class="btn btn--primary">Save</button>
      <button type="button" class="btn btn--ghost" id="budget-cancel-btn">Cancel</button>
    </div>
  </form>

  <p class="budget-card__warning" id="budget-warning" hidden>
    You're over your monthly budget.
  </p>
</section>
```

The dash-array constant `263.8938` is `2 * Math.PI * 42` (the ring circumference for `r=42`). The bar starts fully offset (empty).

- [ ] **Step 3: Append styles to `public/styles.css`**

```css
.budget-card { display: flex; flex-direction: column; gap: 0.75rem; }
.budget-card__body { display: flex; align-items: center; gap: 1rem; }
.budget-ring { width: 96px; height: 96px; flex: none; }
.budget-ring__track { stroke: var(--surface-2, #2a2a2a); }
.budget-ring__bar { transition: stroke-dashoffset 280ms ease; }
.budget-ring__label { font: 600 1.125rem/1 system-ui; fill: var(--text-1, #fff); text-anchor: middle; dominant-baseline: central; }
.budget-card__figures { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; }
.budget-card__figures .primary { font-size: 1rem; font-weight: 600; }
.budget-card__warning { color: var(--danger, #ff6b6b); font-weight: 600; }
.budget-card[data-state='ok']      .budget-ring__bar { stroke: var(--accent, #4ade80); }
.budget-card[data-state='caution'] .budget-ring__bar { stroke: var(--warning, #f5b50a); }
.budget-card[data-state='over']    .budget-ring__bar { stroke: var(--danger, #ff6b6b); }
.budget-card[data-state='unset']   .budget-ring__bar { stroke: var(--surface-3, #3a3a3a); }
.budget-card__form { display: flex; flex-direction: column; gap: 0.5rem; }
.budget-card__actions { display: flex; gap: 0.5rem; }
```

(Swap token names if the project's design system uses different ones.)

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/styles.css
git commit -m "feat(ui): add budget ring card skeleton and styles"
```

---

### Task 9: UI — fetch + safe DOM updates (no innerHTML)

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Add helpers and wiring**

Near the dashboard logic, add:

```js
const BUDGET_RING_CIRCUMFERENCE = 2 * Math.PI * 42; // 263.8938

async function fetchBudget() {
  const res = await api('/api/users/me/budget');
  if (!res.ok) throw new Error('Failed to load budget');
  const body = await res.json();
  return body.data;
}

function formatUsd(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function setRing(percentUsed) {
  const bar = document.getElementById('budget-ring-bar');
  const label = document.getElementById('budget-ring-label');
  const pct = percentUsed === null ? 0 : Math.min(100, Math.max(0, percentUsed));
  const offset = BUDGET_RING_CIRCUMFERENCE * (1 - pct / 100);
  bar.setAttribute('stroke-dashoffset', String(offset));
  label.textContent = percentUsed === null ? '—' : `${percentUsed}%`;
}

function renderBudgetCard(view) {
  const card = document.getElementById('budget-card');
  const body = document.getElementById('budget-card-body');
  const editBtn = document.getElementById('budget-edit-btn');
  const form = document.getElementById('budget-form');
  const warning = document.getElementById('budget-warning');
  const input = document.getElementById('budget-input');

  const primary = document.getElementById('budget-primary');
  const net = document.getElementById('budget-net');
  const days = document.getElementById('budget-days');

  card.hidden = false;

  if (view.budgetCents === null) {
    card.dataset.state = 'unset';
    setRing(null);
    primary.textContent = 'Set a monthly budget';
    net.textContent = 'Track your net loss against a cap.';
    days.textContent = '';
    editBtn.hidden = true;
    form.hidden = false;
    warning.hidden = true;
    body.hidden = true;
    input.value = '';
    return;
  }

  card.dataset.state = view.state ?? 'ok';
  setRing(view.percentUsed);
  primary.textContent = `${formatUsd(view.lossUsedCents)} / ${formatUsd(view.budgetCents)}`;
  net.textContent = `Net P/L ${formatUsd(view.netResultCents)}`;
  days.textContent = `${view.daysLeftInMonth} days left`;

  editBtn.hidden = false;
  form.hidden = true;
  body.hidden = false;
  warning.hidden = view.state !== 'over';
  input.value = String(Math.round(view.budgetCents / 100));
}

async function refreshBudget() {
  try {
    renderBudgetCard(await fetchBudget());
  } catch (err) {
    console.error(err);
  }
}

function wireBudgetCard() {
  const editBtn = document.getElementById('budget-edit-btn');
  const cancelBtn = document.getElementById('budget-cancel-btn');
  const form = document.getElementById('budget-form');
  const body = document.getElementById('budget-card-body');

  editBtn.addEventListener('click', () => {
    form.hidden = false;
    body.hidden = true;
  });
  cancelBtn.addEventListener('click', () => {
    form.hidden = true;
    body.hidden = false;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('budget-input');
    const dollars = Number(input.value);
    if (!Number.isFinite(dollars) || dollars < 1) return;
    const res = await api('/api/users/me/budget', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: Math.round(dollars * 100) }),
    });
    if (res.ok) await refreshBudget();
  });
}
```

- [ ] **Step 2: Hook into app init + dashboard load**

- Call `wireBudgetCard()` once during app init, alongside other one-time wiring.
- Inside whatever function loads the dashboard (look for `/users/me/stats` fetch), add a sibling call `await refreshBudget();`.

- [ ] **Step 3: Manual smoke test**

Start the dev server and:
- Visit dashboard as a new user → card shows "Set a monthly budget" with the inline form.
- Save `$500` → ring fills to 0%, state class becomes `ok`, figures populate.
- Click Edit → form appears prefilled; Cancel restores the body.
- (If sessions UI is reachable) complete a losing session, refresh → ring updates, state class flips.

Expected: no console errors, no XSS-flag prompts (no `innerHTML` used).

- [ ] **Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat(ui): wire dashboard budget card to /users/me/budget using safe DOM APIs"
```

---

### Task 10: Docs + handoff updates

**Files:**
- Modify: `docs/API.md`
- Modify: `.shared/context/CONTEXT.md`
- Modify: `.shared/context/TODO.md`

- [ ] **Step 1: Document endpoints in `docs/API.md`**

Add a new "Budget" section with `GET /users/me/budget`, `PUT /users/me/budget`, `GET /users/me/budget/history`. Mirror the request/response examples from the spec's API section verbatim, including validation rules.

- [ ] **Step 2: Update `.shared/context/CONTEXT.md`**

Add under the latest-changes section dated `2026-05-15`:

```
- Slice B complete: monthly net-loss budget with history-aware data model, GET/PUT/history endpoints, dashboard ring widget (ok/caution/over).
```

- [ ] **Step 3: Update `.shared/context/TODO.md`**

- Move "Slice B — Budget ring" entry from "Feature Completion Roadmap" to "Completed".
- Tick: `Budget ring logic`, `Phase 3 → Budget ring computation`, `Phase 5 → Budget settings`.
- Make "Slice C — Session limits + break mode" the next item.

- [ ] **Step 4: Final sweep**

```bash
bunx tsc --noEmit && bun test
```

Expected: clean typecheck; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add docs/API.md .shared/context/CONTEXT.md .shared/context/TODO.md
git commit -m "docs(budget): document endpoints and mark Slice B complete"
```

---

## Done criteria

- New table `BudgetSetting` migrated.
- `bunx tsc --noEmit` clean.
- `bun test` all green, including new unit + integration tests.
- Dashboard renders the ring card with correct state on manual smoke test.
- `docs/API.md`, `CONTEXT.md`, `TODO.md` updated.
