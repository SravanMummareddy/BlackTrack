# Claude Agent Instructions — BlackStack

> Auto-generated from `.shared/CANONICAL_INSTRUCTIONS.md`
> Run `./scripts/sync-instructions.sh` to regenerate.

---

Full canonical instructions: `.shared/CANONICAL_INSTRUCTIONS.md`. Read that first.

---

## Active Plugins

| Plugin | When to use |
|---|---|
| **superpowers** | Before any multi-step task — invoke the matching skill first |
| **context-mode** | Auto-runs via hooks; use `ctx_execute` for large outputs |
| **claude-mem** | `/claude-mem:learn-codebase` at session start; `/claude-mem:mem-search` for prior work |
| **skill-creator** | When a recurring pattern needs a dedicated skill |
| **frontend-design** | When building UI components or implementing the v2 design |

---

## Runtime: Bun

```sh
bun install          # install dependencies
bun run dev          # start dev server (hot reload)
bun test             # run tests
bun add <pkg>        # add dependency
```

Use `bun` — not `npm`, `npx`, or `node` — for all package and script operations.

---

## Before You Code

- [ ] Run `/superpowers:using-superpowers` at the start of any new conversation
- [ ] Read `.shared/context/CONTEXT.md` — current project state
- [ ] Read `.shared/context/TODO.md` — what's in scope
- [ ] Run `/superpowers:writing-plans` for any multi-step task
- [ ] Run `/superpowers:brainstorming` before any feature/component work
- [ ] Run `/claude-mem:learn-codebase` if this is a new session on an unfamiliar area
- [ ] Check `.shared/skills/` for patterns relevant to your work
- [ ] Run `bun test` to confirm a green baseline

---

## While Coding

- Follow all naming conventions in `.shared/CANONICAL_INSTRUCTIONS.md`
- Use `bun add` to add packages — not npm
- Validate input with Zod at API boundaries
- Use `src/utils/errors.ts` for custom error classes
- Use `src/utils/logger.ts` — not `console.log`
- Wrap multi-step DB writes in Prisma transactions
- Reference design tokens from `design/v2/frame.jsx` for any UI work

---

## After You Code

- [ ] Run `/superpowers:verification-before-completion` before claiming done
- [ ] `bun test` — all tests pass
- [ ] `bun run lint` — no errors
- [ ] `bun run build` — no type errors
- [ ] Run `/superpowers:requesting-code-review` for significant features
- [ ] Update `.shared/context/CONTEXT.md`
- [ ] Update `.shared/context/TODO.md`
- [ ] `bun run handoff` before switching agents

---

## Key File Locations

| What | Where |
|---|---|
| Project state | `.shared/context/CONTEXT.md` |
| Task list | `.shared/context/TODO.md` |
| Decisions | `.shared/context/DECISIONS.md` |
| Coding standards | `.shared/CANONICAL_INSTRUCTIONS.md` |
| Design reference | `design/v2.html` |
| Design tokens | `design/v2/frame.jsx` (V object) |
| Error classes | `src/utils/errors.ts` |
| Logger | `src/utils/logger.ts` |
| DB client | `src/database/index.ts` |
| Auth middleware | `src/middleware/index.ts` |
