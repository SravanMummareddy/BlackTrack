# Style Guide — BlackStack

## General Principles

BlackStack currently values:
- small vertical slices
- clear API contracts
- integer-cents money handling
- simple production code over speculative abstractions
- preserving `design/` as reference while shipping real code from `public/`

## Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `session-service.ts` |
| Directories | `kebab-case` | `src/services/` |
| Functions | `camelCase` | `getSessionStats()` |
| Variables | `camelCase` | `handsPlayed` |
| Classes | `PascalCase` | `ValidationError` |
| Types / Interfaces | `PascalCase` | `AuthTokens` |
| Constants | `UPPER_SNAKE_CASE` | `TOKEN_CONFIG` |
| Prisma enums | `PascalCase` members | `SessionStatus.ACTIVE` |
| Routes | plural nouns where appropriate | `/sessions`, `/users/me` |

## Backend Conventions

### Route Handlers

Keep route files thin.

Route handlers should:
- validate input
- call a service or focused Prisma query
- return JSON
- throw errors instead of catching them locally unless a route truly needs special handling

### Services

Put business rules in `src/services/`.

Examples:
- session ownership checks
- completed-session protection before hand logging
- strategy evaluation and progress computation

### Errors

Use the typed errors from `src/utils/errors.ts`.

Preferred pattern:

```ts
if (!session) {
  throw new NotFoundError('Session');
}
```

Do not silently swallow errors in async flows.

### Money

Always treat money as integer cents in the backend and client API payloads.

Good:

```ts
buyIn: 30000
tableMin: 2500
```

Avoid:

```ts
buyIn: 300.00
```

## Frontend Conventions

Current production frontend lives in `public/`.

Guidelines:
- keep `public/app.js` focused on real user flows
- prefer small rendering helpers over giant inline templates where practical
- preserve the current visual system in `public/styles.css`
- do not edit `design/` as if it were production code

## Documentation Conventions

Keep docs aligned to the current app, not aspirational features.

If something is not implemented yet:
- say that directly
- avoid implying it exists in production

Update these at milestones:
- `README.md`
- `docs/API.md`
- `.shared/context/CONTEXT.md`
- `.shared/context/TODO.md`
- `.shared/context/CODEBASE_SUMMARY.md`

## Testing Conventions

Current test stack:
- Bun test
- Supertest
- real Express app integration coverage

When adding tests:
- prefer meaningful end-to-end API coverage over shallow mocks
- keep auth/session/hand/strategy flows realistic
- clean up test-created user data
- document environment assumptions when the suite needs a migrated local database

## Comment Style

Use comments sparingly.

Good comments explain:
- why a constraint exists
- why a value is converted
- why a workaround is necessary

Avoid comments that only restate the code.

## Git Workflow

Expected workflow for this project:
1. work in small vertical slices
2. verify the slice
3. update handoff/context markdown
4. commit with a meaningful message
5. push checkpoints regularly

This matters because the repo contains both design artifacts and live product code, and small checkpoints make it easier to keep them separate.
