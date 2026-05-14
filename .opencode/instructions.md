# OpenCode Agent Instructions — BlackStack

> Auto-generated from `.shared/CANONICAL_INSTRUCTIONS.md`
> Run `./scripts/sync-instructions.sh` to regenerate.

---

Full canonical instructions: `.shared/CANONICAL_INSTRUCTIONS.md`. Read that first.

Note: OpenCode does not support MCP or Claude Code plugins. Use direct tool calls for integrations.

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

- [ ] Read `.shared/context/CONTEXT.md`
- [ ] Read `.shared/context/TODO.md`
- [ ] Check `.shared/skills/` for relevant patterns
- [ ] Review `.shared/context/DECISIONS.md` for architectural choices
- [ ] Run `bun test` for a green baseline

---

## After You Code

- [ ] `bun test` — all tests pass
- [ ] `bun run lint` — no errors
- [ ] `bun run build` — no type errors
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
| Design reference | `design/v2.html` |
| Design tokens | `design/v2/frame.jsx` (V object) |
| Error classes | `src/utils/errors.ts` |
| Logger | `src/utils/logger.ts` |
| DB client | `src/database/index.ts` |
