# Multi-Agent Workflow Guide — BlackStack

---

## Agent Toolkit

Skill layout and install workflow for this machine are documented in [SKILLS.md](./SKILLS.md). Read that before changing agent skill configuration or installing shared skills.

All agents working in this repo have access to these Claude Code plugins:

| Plugin | Purpose | Key Commands |
|---|---|---|
| **superpowers** | Enforces disciplined dev workflow via 11 skills | See table below |
| **context-mode** | Compresses large outputs; protects context window | Auto-runs via hooks |
| **claude-mem** | Cross-session persistent memory | `/claude-mem:learn-codebase`, `/claude-mem:mem-search` |
| **skill-creator** | Build new project-specific skills | `/skill-creator:skill-creator` |
| **frontend-design** | UI component and design system work | `/frontend-design:frontend-design` |
| **design skills (gstack)** | Senior UI/UX taste and execution layer for any visual work | `/impeccable`, `/emil-design-eng`, `/stitch-design-taste`, `/design-taste-frontend`, `/high-end-visual-design`, `/minimalist-ui`, `/industrial-brutalist-ui`, `/redesign-existing-projects`, `/image-to-code`, `/imagegen-frontend-web`, `/imagegen-frontend-mobile`, `/brandkit`, `/gpt-taste`, `/full-output-enforcement`, `/find-skills` |

### UI / UX routing

For any frontend task that touches `public/` or `design/`, route through a design skill BEFORE editing:

| Trigger | Skill |
|---|---|
| Critique, polish, or audit an existing screen | `/impeccable` |
| Redesign an existing screen or flow | `/redesign-existing-projects` |
| Design-engineering execution (component-level) | `/emil-design-eng` or `/design-taste-frontend` |
| Generate or evolve a DESIGN.md / design system | `/stitch-design-taste` or `/design-consultation` |
| Pick an aesthetic direction | `/high-end-visual-design`, `/minimalist-ui`, `/industrial-brutalist-ui` |
| Convert a screenshot or mock to code | `/image-to-code` |
| Generate concept imagery before coding | `/imagegen-frontend-web`, `/imagegen-frontend-mobile` |
| Investigate UI bugs (e.g. login hidden on mobile, stuck loading state) | `/investigate` first, then a design skill for the visual fix |

---

## Superpowers Skills — When to Use

| Skill | Trigger |
|---|---|
| `using-superpowers` | Start of every new conversation |
| `writing-plans` | Before touching code on any multi-step task |
| `brainstorming` | Before any creative/feature/component work |
| `test-driven-development` | Before writing implementation code |
| `systematic-debugging` | Before proposing any bug fix |
| `verification-before-completion` | Before claiming work is done or making a PR |
| `requesting-code-review` | After completing a feature |
| `receiving-code-review` | When acting on review feedback |
| `dispatching-parallel-agents` | When 2+ independent tasks exist |
| `executing-plans` | When running a written plan in a fresh session |
| `finishing-a-development-branch` | When ready to merge |
| `using-git-worktrees` | Before isolated feature work |
| `subagent-driven-development` | When running plans with independent tasks |

---

## Agent Roles

| Agent | Typical Focus | Config File |
|---|---|---|
| Claude Code | Full-stack features, architecture, UI | `.claude/claude.json` |
| OpenCode | Backend logic, services, refactoring | `.opencode/config.yaml` |

Both agents follow `.shared/CANONICAL_INSTRUCTIONS.md`.

---

## Runtime

All commands use **Bun** (v1.3+):

```sh
bun install          # install deps
bun run dev          # dev server
bun test             # run tests
bun add <pkg>        # add a package
bun run handoff      # pre-switch validation
```

---

## Switching Agents: Pre-Switch Checklist

1. `bun test` — all tests pass
2. `bun run typecheck` — no type errors
3. `bun run lint` — no lint errors
4. Commit (use `wip:` prefix if incomplete)
5. Update `.shared/context/CONTEXT.md`
6. Update `.shared/context/TODO.md`
7. Log decisions in `.shared/context/DECISIONS.md`
8. `bun run handoff` — final validation

---

## Post-Switch Checklist (Incoming Agent)

1. `/superpowers:using-superpowers` — orient yourself
2. Read `.shared/context/CONTEXT.md`
3. Read `.shared/context/TODO.md`
4. Read `SKILLS.md` if the task touches agent skills, skill installation, or runtime setup
5. `/claude-mem:learn-codebase` — prime memory with codebase
6. `/claude-mem:mem-search` — check what prior sessions accomplished
7. `bun install && bun test` — verify baseline
8. Check `.shared/skills/` for relevant patterns

---

## Example Workflow

```
Agent A — implements Sessions API
  ├── /superpowers:using-superpowers
  ├── /claude-mem:learn-codebase
  ├── /superpowers:writing-plans  (plans the implementation)
  ├── /superpowers:test-driven-development  (writes tests first)
  ├── implements src/services/session-service.ts
  ├── /superpowers:verification-before-completion
  ├── updates CONTEXT.md + TODO.md
  └── bun run handoff ✓

Agent B — implements Analytics
  ├── /superpowers:using-superpowers
  ├── /claude-mem:mem-search  ("what did Agent A build?")
  ├── reads CONTEXT.md — knows session service is complete
  └── continues with analytics aggregation...
```

---

## Context Files Reference

| File | Updated By | Read By | Purpose |
|---|---|---|---|
| `.shared/context/CONTEXT.md` | Every agent before handoff | First thing incoming agent reads | Current state, blockers, next steps |
| `.shared/context/TODO.md` | Every agent | Every agent | Task backlog by phase |
| `.shared/context/DECISIONS.md` | When architectural decisions are made | Before making design choices | ADR log |
| `.shared/context/CODEBASE_SUMMARY.md` | When module structure changes | New agents | Module map and where to make changes |
