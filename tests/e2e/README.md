# E2E tests

Playwright browser tests against a running BlackStack server.

## Setup

```bash
bun add -d @playwright/test
bunx playwright install chromium
```

## Run

Start the server in one terminal:

```bash
bun run dev
```

Then in another:

```bash
bunx playwright test tests/e2e --config tests/e2e/playwright.config.ts
```

## Coverage

- `smoke.spec.ts` — landing page loads, auth card renders, `/healthz` responds.

Add new specs alongside `smoke.spec.ts`. Keep specs feature-scoped: one file per user flow (auth, session-create, trainer, etc.).
