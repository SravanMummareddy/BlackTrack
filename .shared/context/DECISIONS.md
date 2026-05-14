# Architecture Decision Records — BlackStack

> Record significant technical decisions here using the ADR format.
> Once recorded, decisions should not be deleted — only superseded.

---

## ADR Template

Copy this block for each new decision:

```
## ADR-NNN: [Decision Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNN

### Context
What situation or problem required a decision?

### Decision
What was decided?

### Consequences
What are the results of this decision — both positive and negative?

### Alternatives Considered
- Option A — why it was rejected
- Option B — why it was rejected

### Implementation Notes
Any specific notes about how this was or should be implemented.

### Related ADRs
- [[ADR-NNN]]
```

---

## ADR-003: Port basic strategy engine from prototype JSX to TypeScript service

**Date**: 2026-05-14
**Status**: Accepted

### Context
The interactive prototype (`design/prototype/trainer.jsx`) contains a complete, tested-in-browser basic strategy lookup table (`STRAT`) and hand evaluation engine. Writing it from scratch in TypeScript would duplicate work and risk introducing errors.

### Decision
Extract the strategy logic from `design/prototype/trainer.jsx` into `src/services/strategy-service.ts` with TypeScript types. The lookup table structure stays the same, and seed data should come from the same source tables used at runtime.

### Consequences
- **Positive**: No rework; the prototype logic was validated visually against textbook charts.
- **Negative**: JSX → TypeScript port requires careful type annotation; original code uses plain objects.

### Implementation Notes
- Read `design/prototype/trainer.jsx` before starting — the `STRAT` object and `evaluate()` function are the core.
- Add types: `Hand`, `DealerUpcard`, `Action`, `StrategyResult` (action + reasoning string + rule of thumb).
- Unit test every hard total (5–21), every soft hand (soft 13–soft 21), every pair.

## ADR-004: Seed strategy scenarios from shared runtime tables

**Date**: 2026-05-14
**Status**: Accepted

### Context
The app stores strategy scenarios in the database for random drills and attempt tracking, but the correct plays also need to exist in application code for evaluation responses. Duplicating those rule tables in two places would create drift.

### Decision
Use a single source of truth in `src/services/strategy-service.ts` for blackjack strategy tables. The seed script derives `StrategyScenario` rows from those tables, and the API uses the same tables to evaluate submitted attempts.

### Consequences
- **Positive**: Seeded content and runtime evaluation stay aligned.
- **Positive**: Future chart updates only need to happen in one place.
- **Negative**: The service module now owns both runtime logic and seed-data generation, so it should stay well-tested.

### Alternatives Considered
- **Separate static seed file** — rejected because it risks diverging from runtime logic.
- **Database-only source of truth** — rejected because reasoning and fallback evaluation logic still need application code.

### Implementation Notes
- `scripts/seed-strategy.ts` should be idempotent and preserve existing rows by unique scenario identity.
- Scenario uniqueness is defined by `[playerCards, dealerUpcard, isSoft, isPair]`.

## ADR-005: Keep prototypes as reference and build the real app separately

**Date**: 2026-05-14
**Status**: Accepted

### Context
The repository contains rich design artifacts in `design/`, especially `design/prototype.html`, but those files are not the production application. An earlier attempt to wire the prototype directly to the live API caused regressions and user frustration.

### Decision
Preserve `design/` as reference-only and build the actual responsive web application separately under `public/`, served by the existing Express app.

### Consequences
- **Positive**: Design exploration remains stable and easy to inspect.
- **Positive**: The real app can evolve without breaking the reference prototype.
- **Negative**: Some UI logic and styling may need to be reimplemented rather than directly reused.

### Alternatives Considered
- **Directly convert `design/prototype.html` into the production app** — rejected because it mixes reference artifacts with shipping code and made rollback harder.
- **Introduce a full new frontend framework immediately** — rejected for now to keep scope manageable and ship in smaller slices.

### Implementation Notes
- `public/` is the production browser app surface.
- `design/` should remain viewable and intact as a design reference.
- Any future rewrite into a framework should happen from the production app, not the prototype files.

## ADR-006: Build the product in small vertical slices with frequent checkpoints

**Date**: 2026-05-14
**Status**: Accepted

### Context
The application scope is broad: auth, session logging, bankroll stats, hand logging, trainer flows, analytics, and responsive UI. Attempting to “finish everything” in one pass slowed progress and made it harder to show visible working results.

### Decision
Build the application in smaller vertical slices:
1. responsive app shell
2. auth + dashboard
3. sessions workspace
4. trainer workspace
5. polish, tests, docs

Use git checkpoints and refresh the handoff markdown after each slice.

### Consequences
- **Positive**: Faster visible progress and easier validation.
- **Positive**: Lower risk of large, hard-to-review regressions.
- **Negative**: Some duplicated planning overhead at each milestone.

### Alternatives Considered
- **Single long implementation pass** — rejected because it makes verification and rollback harder.
- **Pure backend-first completion before UI** — rejected because the user explicitly wants working frontend progress to stay visible.

### Implementation Notes
- Update `.shared/context/CONTEXT.md`, `TODO.md`, and `CODEBASE_SUMMARY.md` at meaningful milestones.
- Prefer commits at the end of each usable vertical slice.

---

## ADR-001: Use Prisma as the ORM

**Date**: [DATE]
**Status**: Accepted

### Context
Need a database abstraction layer for PostgreSQL that provides type safety, migration management, and a good developer experience.

### Decision
Use Prisma ORM for all database access.

### Consequences
- **Positive**: Type-safe queries, automatic migration generation, excellent TypeScript integration, Prisma Studio for data browsing.
- **Negative**: Additional abstraction layer; complex raw queries require `$queryRaw`; Prisma client must be generated after schema changes.

### Alternatives Considered
- **Drizzle ORM** — lighter weight, closer to SQL; rejected because less mature ecosystem at time of decision
- **Raw pg driver** — maximum control; rejected because no migration management or type safety out of the box
- **TypeORM** — more established; rejected because decorator-heavy, weaker TypeScript inference

### Implementation Notes
Always use the singleton pattern for PrismaClient (see `.shared/skills/database-patterns/connection-pooling.md`).

---

## ADR-002: Use Zod for Input Validation

**Date**: [DATE]
**Status**: Accepted

### Context
Need runtime input validation with TypeScript type inference.

### Decision
Use Zod for all API input validation.

### Consequences
- **Positive**: Schema doubles as TypeScript type, excellent error messages, composable, tree-shakeable.
- **Negative**: Bundle size if used on the client; slightly verbose for simple schemas.

### Alternatives Considered
- **Joi** — mature, no TypeScript inference; rejected
- **class-validator** — decorator-based; rejected (prefer functional approach)
- **yup** — similar to Zod but weaker TypeScript support; rejected
