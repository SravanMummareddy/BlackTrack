# API Documentation — BlackStack

Base URL:

```text
http://localhost:3000/api/v1
```

All authenticated endpoints require:

```text
Authorization: Bearer <access_token>
```

## Response Shapes

Success object:

```json
{ "data": { } }
```

Paginated list:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Invalid email" }
    ]
  }
}
```

## Health

### `GET /health`

Checks API and database health.

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-05-14T20:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "ok" }
  }
}
```

### `GET /health/live`

Simple liveness probe.

Example response:

```json
{ "status": "ok" }
```

## Auth

### `POST /auth/register`

Creates a user and returns stateless JWT tokens.

Request:

```json
{
  "email": "player@example.com",
  "name": "Blackjack Player",
  "password": "StrongPass123!"
}
```

Response `201`:

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "player@example.com",
  "password": "StrongPass123!"
}
```

Response `200`:

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### `POST /auth/refresh`

Request:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Response `200`:

```json
{
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### `POST /auth/logout`

Requires auth. Current implementation is a no-op because tokens are stateless.

Response `204` with no body.

## Users

### `GET /users/me`

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "email": "player@example.com",
    "name": "Blackjack Player",
    "role": "USER",
    "createdAt": "2026-05-14T20:00:00.000Z"
  }
}
```

### `PATCH /users/me`

Request:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

Response `200`: same shape as `GET /users/me`.

### `PATCH /users/me/password`

Changes the password for a password-based account. OAuth-only accounts return `409` because password authentication is not enabled.

Request:

```json
{
  "currentPassword": "StrongPass123!",
  "newPassword": "NewStrong123!"
}
```

Validation:

- `currentPassword` is required and must match the current password.
- `newPassword` must be at least 8 characters and include uppercase, lowercase, and a number.

Response `204` with no body.

### `GET /users/me/export`

Returns a JSON export of the authenticated user's account data. Credential fields such as `passwordHash` are never included.

Response `200`:

```json
{
  "data": {
    "exportedAt": "2026-05-15T20:00:00.000Z",
    "user": {
      "id": "uuid",
      "email": "player@example.com",
      "name": "Blackjack Player",
      "role": "USER",
      "oauthProvider": null,
      "createdAt": "2026-05-14T20:00:00.000Z",
      "updatedAt": "2026-05-15T20:00:00.000Z"
    },
    "sessions": [
      {
        "id": "uuid",
        "casinoName": "Bellagio",
        "hands": []
      }
    ],
    "budgetSettings": [],
    "strategyAttempts": []
  }
}
```

`sessions` include nested `hands`; `strategyAttempts` include the related strategy scenario.

### `DELETE /users/me`

Deletes the authenticated user and cascades account-owned data including sessions, hands, budget settings, and strategy attempts.

Request:

```json
{
  "password": "StrongPass123!"
}
```

Response `204` with no body. Existing JWTs become unusable because the user record no longer exists.

### `GET /users/me/stats`

Returns account-level bankroll and hand summary values.

Optional query param:

```text
period=all|year|month|week
```

If omitted, `all` is used.

Response `200`:

```json
{
  "data": {
    "period": "month",
    "windowStart": "2026-04-14T20:00:00.000Z",
    "sessionsPlayed": 4,
    "completedSessions": 3,
    "activeSessions": 1,
    "sessionsWon": 2,
    "sessionsLost": 1,
    "completedSessionWinRate": 0.6667,
    "totalBuyIn": 120000,
    "completedBuyIn": 90000,
    "totalCashOut": 101500,
    "netProfit": 11500,
    "roi": 0.1278,
    "averageSessionNet": 3833,
    "handsPlayed": 61,
    "handsWon": 29,
    "winRate": 0.4754,
    "totalBet": 18400,
    "totalPayout": 3200,
    "averageBet": 302,
    "topCasinos": [
      {
        "casinoName": "Bellagio",
        "sessionsPlayed": 2,
        "completedSessions": 2,
        "activeSessions": 0,
        "totalBuyIn": 60000,
        "totalCashOut": 68200,
        "netProfit": 8200,
        "handsPlayed": 24,
        "handsWon": 12,
        "averageSessionNet": 4100,
        "winRate": 0.5,
        "roi": 0.1367
      }
    ]
  }
}
```

## Budget

Monthly budget endpoints track a user's current-month net-loss cap. Money fields are integer cents. Budget enforcement is visual only in this slice; session blocking belongs to later responsible-play work.

### `GET /users/me/budget`

Returns the current month budget view, including server-computed net result, loss used, percent used, days left, and state.

Response `200` when a budget is set:

```json
{
  "data": {
    "monthStart": "2026-05-01T00:00:00.000Z",
    "budgetCents": 50000,
    "effectiveFrom": "2026-05-01T00:00:00.000Z",
    "netResultCents": -23000,
    "lossUsedCents": 23000,
    "percentUsed": 46,
    "state": "ok",
    "daysLeftInMonth": 17
  }
}
```

If no effective budget exists for the current month, `budgetCents`, `effectiveFrom`, `percentUsed`, and `state` are `null`; `netResultCents`, `lossUsedCents`, and `daysLeftInMonth` are still computed.

### `PUT /users/me/budget`

Upserts a monthly budget setting. If `effectiveFrom` is omitted, the current UTC month start is used.

Request:

```json
{
  "amountCents": 50000,
  "effectiveFrom": "2026-05-01T00:00:00.000Z"
}
```

Validation:

- `amountCents` must be an integer of at least `100`.
- `effectiveFrom`, when supplied, must be the first day of a month at `00:00:00.000Z`.
- `effectiveFrom` cannot be before the user's account-creation month.

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "amountCents": 50000,
    "effectiveFrom": "2026-05-01T00:00:00.000Z",
    "createdAt": "2026-05-15T16:00:00.000Z",
    "updatedAt": "2026-05-15T16:00:00.000Z"
  }
}
```

### `GET /users/me/budget/history`

Returns all budget settings for the authenticated user ordered by `effectiveFrom` descending.

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amountCents": 50000,
      "effectiveFrom": "2026-05-01T00:00:00.000Z",
      "createdAt": "2026-05-15T16:00:00.000Z",
      "updatedAt": "2026-05-15T16:00:00.000Z"
    }
  ]
}
```

### `GET /users/me/mood-analytics`

Aggregates completed sessions by mood bucket. Query params:

- `period` — `all` (default), `year`, `month`, `week`
- `bucket` — `start` (default, groups by `moodStart`) or `end` (groups by `moodEnd`)

Response `200`:

```json
{
  "data": {
    "period": "all",
    "bucket": "start",
    "windowStart": null,
    "totalCompletedSessions": 12,
    "buckets": [
      {
        "mood": 4,
        "sessions": 5,
        "netProfit": 18500,
        "totalBuyIn": 150000,
        "averageNet": 3700,
        "sessionWinRate": 0.6,
        "handWinRate": 0.48,
        "roi": 0.12
      }
    ]
  }
}
```

`mood` is `null` for sessions with no mood recorded.

### `GET /users/me/break`

Returns the responsible-play break state. Response `200`:

```json
{ "data": { "active": false, "breakUntil": null } }
```

### `PUT /users/me/break`

Request: `{ "duration": "24h" | "7d" | "30d" }`. Starts a break; new session creation is blocked with `403` until it expires.

### `DELETE /users/me/break`

Clears the active break.

## Sessions

Money fields are integer cents. Sessions accept optional `lossLimitCents` and `timeLimitMinutes`; every session payload includes a computed `limitState` with `netLossCents`, `elapsedMinutes`, and `anyLimitHit`.

### `POST /sessions`

Request:

```json
{
  "casinoName": "Bellagio",
  "tableMin": 2500,
  "tableMax": 20000,
  "decks": 6,
  "buyIn": 30000,
  "notes": "Crowded pit, staying disciplined.",
  "tags": ["disciplined", "heads-up"],
  "moodStart": 4
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "casinoName": "Bellagio",
    "tableMin": 2500,
    "tableMax": 20000,
    "decks": 6,
    "startedAt": "2026-05-14T20:00:00.000Z",
    "endedAt": null,
    "status": "ACTIVE",
    "buyIn": 30000,
    "cashOut": null,
    "notes": "Crowded pit, staying disciplined.",
    "tags": ["disciplined", "heads-up"],
    "moodStart": 4,
  "moodEnd": null,
  "completionNotes": null,
  "liveNetProfit": 0,
  "netProfit": null,
  "createdAt": "2026-05-14T20:00:00.000Z",
  "updatedAt": "2026-05-14T20:00:00.000Z",
  "handsPlayed": 0,
    "handsWon": 0
  }
}
```

### `GET /sessions?page=1&pageSize=20`

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "casinoName": "Bellagio",
      "status": "ACTIVE",
      "buyIn": 30000,
      "cashOut": null,
      "tags": ["disciplined", "heads-up"],
      "moodStart": 4,
      "handsPlayed": 3,
      "handsWon": 1,
      "liveNetProfit": -7500,
      "netProfit": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### `GET /sessions/:id`

Returns the full session record.

### `PATCH /sessions/:id`

Request fields are all optional:

```json
{
  "casinoName": "Bellagio High Limit",
  "tableMin": 5000,
  "tableMax": 50000,
  "decks": 8,
  "buyIn": 60000,
  "notes": "Left when game quality dipped.",
  "cashOut": 36200,
  "status": "COMPLETED",
  "tags": ["disciplined"],
  "moodStart": 4,
  "moodEnd": 5,
  "completionNotes": "Stayed patient and left after the planned shoe."
}
```

When `status` becomes `COMPLETED`, `endedAt` is set if it was empty.
When `status` becomes `ACTIVE`, `endedAt` and `cashOut` are cleared so a completed session can be reopened for correction.
`tags` accepts up to 8 trimmed tags, each 32 characters or fewer. `moodStart` and `moodEnd` are integers from `1` to `5`.
Session responses include `liveNetProfit`, computed from logged hand payouts, and `netProfit`, computed from `cashOut - buyIn` only when a session has a cash-out value.

### `DELETE /sessions/:id`

Deletes the session and its hands.

Response `204` with no body.

## Hands

Nested under a session:

```text
/sessions/:sessionId/hands
```

### `POST /sessions/:sessionId/hands`

Request:

```json
{
  "bet": 2500,
  "result": "WIN",
  "playerCards": ["A", "8"],
  "dealerCards": ["6", "10"],
  "playerTotal": 19,
  "dealerTotal": 16,
  "splitHand": false,
  "doubled": false,
  "surrendered": false,
  "payout": 2500
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "sessionId": "uuid",
    "handNumber": 1,
    "bet": 2500,
    "result": "WIN",
    "playerCards": ["A", "8"],
    "dealerCards": ["6", "10"],
    "playerTotal": 19,
    "dealerTotal": 16,
    "splitHand": false,
    "doubled": false,
    "surrendered": false,
    "payout": 2500,
    "playedAt": "2026-05-14T20:00:00.000Z"
  }
}
```

### `GET /sessions/:sessionId/hands?page=1&pageSize=20`

Returns a paginated list of hands ordered by `handNumber`.

### `GET /sessions/:sessionId/hands/stats`

Response `200`:

```json
{
  "data": {
    "handsPlayed": 12,
    "handsWon": 6,
    "winRate": 0.5,
    "netProfit": 4800,
    "roi": 0.16,
    "totalBet": 29000,
    "liveNetProfit": 4800,
    "avgBet": 2416.67,
    "biggestWin": {
      "id": "uuid",
      "payout": 5000
    },
    "biggestLoss": {
      "id": "uuid",
      "payout": -5000
    }
  }
}
```

`netProfit` and `roi` are based on session completion state, so they can be `null` for active sessions.
`liveNetProfit` is based on logged hand payouts and is available while a session is active.

### `PATCH /sessions/:sessionId/hands/:handId`

Corrects a logged hand. Request fields are optional, but at least one field is required.

Request:

```json
{
  "result": "WIN",
  "dealerCards": ["9", "6", "5"],
  "dealerTotal": 20,
  "payout": 2500
}
```

Response `200`: same hand shape as `POST /sessions/:sessionId/hands`.

After a hand edit, the parent session's cached `handsPlayed` and `handsWon` values are recalculated from the current hand history.

### `DELETE /sessions/:sessionId/hands/:handId`

Deletes a logged hand and recalculates the parent session counters.

Response `204` with no body.

## Strategy

### `GET /strategy/scenarios/random`

Optional query params:
- `difficulty=1|2|3`
- `isSoft=true|false`
- `isPair=true|false`

Response `200`:

```json
{
  "data": {
    "id": "uuid",
    "playerCards": ["A", "7"],
    "dealerUpcard": "6",
    "playerTotal": 18,
    "isSoft": true,
    "isPair": false,
    "correctAction": "DOUBLE",
    "difficulty": 2,
    "createdAt": "2026-05-14T20:00:00.000Z"
  }
}
```

### `GET /strategy/scenarios/:id`

Fetch a specific scenario by ID. This is used by the trainer review queue to reopen missed hands.

Response `200`: same scenario shape as `GET /strategy/scenarios/random`.

### `POST /strategy/attempts`

Request:

```json
{
  "scenarioId": "uuid",
  "action": "DOUBLE",
  "timeMs": 1350
}
```

Response `201`:

```json
{
  "data": {
    "attempt": {
      "id": "uuid",
      "userId": "uuid",
      "scenarioId": "uuid",
      "action": "DOUBLE",
      "correct": true,
      "timeMs": 1350,
      "attemptedAt": "2026-05-14T20:00:00.000Z"
    },
    "evaluation": {
      "action": "DOUBLE",
      "correct": true,
      "correctAction": "DOUBLE",
      "reasoning": "This is a profitable double spot: your soft 18 has enough equity to press the advantage.",
      "ruleOfThumb": "Soft 13-18 often doubles against weak dealer upcards."
    }
  }
}
```

### `GET /strategy/progress`

Response `200`:

```json
{
  "data": {
    "attempts": 18,
    "correct": 13,
    "accuracy": 0.7222,
    "averageResponseTimeMs": 1420,
    "lastAttemptAt": "2026-05-14T20:00:00.000Z",
    "currentStreak": 3,
    "bestStreak": 6,
    "recentMistakes": [
      {
        "scenarioId": "uuid",
        "attemptedAt": "2026-05-14T20:00:00.000Z",
        "action": "HIT",
        "correctAction": "STAND",
        "timesMissed": 2,
        "scenario": {
          "id": "uuid",
          "playerCards": ["10", "6"],
          "dealerUpcard": "6",
          "playerTotal": 16,
          "isSoft": false,
          "isPair": false,
          "difficulty": 3
        }
      }
    ]
  }
}
```

## Error Codes

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `UNPROCESSABLE`
- `RATE_LIMIT_EXCEEDED`

## Notes

- Money is stored as integer cents across all session and hand endpoints.
- Refresh and access tokens are both returned in JSON today.
- `POST /auth/logout` currently returns `204` and does not blacklist tokens yet.
- `design/` is not part of the API surface; the real browser app is served from `/`.
