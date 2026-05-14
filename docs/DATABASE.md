# Database Documentation — BlackStack

## Database Stack

- Engine: PostgreSQL
- ORM: Prisma
- Schema file: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

Local Docker defaults currently use:

```text
postgresql://postgres:postgres@localhost:5432/appdb
```

## Current Schema Overview

### `User`

Stores identity and authentication fields.

Key columns:
- `id`
- `email`
- `name`
- `passwordHash`
- `oauthProvider`
- `oauthId`
- `role`
- timestamps

Relationships:
- one user has many `CasinoSession`
- one user has many `StrategyAttempt`

### `CasinoSession`

Represents one blackjack session for one user.

Key columns:
- `casinoName`
- `tableMin`
- `tableMax`
- `decks`
- `buyIn`
- `cashOut`
- `status`
- `notes`
- `handsPlayed`
- `handsWon`
- `startedAt`
- `endedAt`

Relationships:
- belongs to one `User`
- has many `Hand`

### `Hand`

Represents one logged blackjack hand within a session.

Key columns:
- `handNumber`
- `bet`
- `result`
- `playerCards`
- `dealerCards`
- `playerTotal`
- `dealerTotal`
- `splitHand`
- `doubled`
- `surrendered`
- `payout`
- `playedAt`

Relationship:
- belongs to one `CasinoSession`

### `StrategyScenario`

Represents a training prompt in the basic strategy drill.

Key columns:
- `playerCards`
- `dealerUpcard`
- `playerTotal`
- `isSoft`
- `isPair`
- `correctAction`
- `difficulty`

Relationship:
- has many `StrategyAttempt`

### `StrategyAttempt`

Stores a user’s answer to a scenario.

Key columns:
- `action`
- `correct`
- `timeMs`
- `attemptedAt`

Relationships:
- belongs to one `User`
- belongs to one `StrategyScenario`

## Relationship Summary

```text
User 1 -> many CasinoSession
CasinoSession 1 -> many Hand
User 1 -> many StrategyAttempt
StrategyScenario 1 -> many StrategyAttempt
```

Cascade rules currently matter in these places:
- deleting a user deletes sessions and attempts
- deleting a session deletes hands
- deleting a scenario deletes attempts

## Money and Stats Conventions

Important data rules:
- all money is stored as integer cents
- `payout` on a hand is net result, not returned chips
- session `netProfit` is derived from `cashOut - buyIn`
- user bankroll stats aggregate across sessions and hands

## Indexes

Current important indexes from the Prisma schema:
- `User.email`
- `User.oauthProvider + oauthId`
- `CasinoSession.userId`
- `CasinoSession.startedAt`
- `Hand.sessionId`
- `Hand.playedAt`
- `StrategyAttempt.userId`
- `StrategyAttempt.scenarioId`
- `StrategyAttempt.attemptedAt`

Unique constraints:
- `User.email`
- `StrategyScenario(playerCards, dealerUpcard, isSoft, isPair)`

## Migrations

Create and apply a development migration:

```sh
bun run db:migrate
```

Apply existing migrations without creating a new one:

```sh
bun run db:migrate:deploy
```

Generate Prisma client:

```sh
bun run db:generate
```

Open Prisma Studio:

```sh
bun run db:studio
```

Migration rules:
1. Never edit committed migration SQL in place.
2. Add new migrations for schema changes.
3. Verify destructive changes against real data needs first.
4. Keep seed logic aligned with runtime rules when touching strategy data.

## Seed Data

Current seed script:

```sh
bun run seed:strategy
```

This script:
- generates strategy scenarios from the same rule tables used at runtime
- is intended to be idempotent
- should be rerun after changing strategy tables or scenario-generation logic

## Operational Notes

- There is no Redis-backed persistence requirement for the current app.
- The integration test suite expects a migrated local Postgres database.
- The repo currently uses one shared local database by default rather than a dedicated ephemeral test database.

## Useful Query Patterns

Get sessions for a user, newest first:

```ts
await prisma.casinoSession.findMany({
  where: { userId },
  orderBy: { startedAt: 'desc' },
});
```

Get all hands for a session:

```ts
await prisma.hand.findMany({
  where: { sessionId },
  orderBy: { handNumber: 'asc' },
});
```

Aggregate strategy progress:

```ts
await prisma.strategyAttempt.aggregate({
  where: { userId },
  _count: { _all: true },
  _avg: { timeMs: true },
});
```
