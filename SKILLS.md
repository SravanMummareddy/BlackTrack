# Skills Setup

This machine uses a split skill layout:

- Shared third-party skills: `~/.agents/skills`
- Codex system skills: `~/.codex/skills/.system`

`~/.agents/skills` is the canonical source of truth for installable shared skills. Codex can read those directly. Claude and OpenCode receive symlink mirrors from that shared directory.

## Install Workflow

Use:

```sh
skills add <owner/repo@skill> -g -y
```

Do not prefer raw `npx skills add ...` unless you also run:

```sh
~/.agents/sync-skills.sh
```

The `skills` shell wrapper does two things:

1. Installs the skill into `~/.agents/skills`
2. Runs `~/.agents/sync-skills.sh` to mirror shared skills into:
   - `~/.claude/skills`
   - `~/.config/opencode/skills`
   - `~/.opencode/skills`
   - `~/.cursor/skills`

Codex is intentionally excluded from that mirror step to avoid duplicate skill roots. `~/.codex/skills` should stay reserved for Codex-specific built-ins and contain `.system`.

## Current Layout

### Shared Skills

These live in `~/.agents/skills`:

- `brainstorming`
- `brandkit`
- `context-mode-ops`
- `ctx-purge`
- `design-consultation`
- `design-taste-frontend`
- `dispatching-parallel-agents`
- `emil-design-eng`
- `executing-plans`
- `find-skills`
- `finishing-a-development-branch`
- `frontend-design`
- `full-output-enforcement`
- `gpt-taste`
- `high-end-visual-design`
- `image-to-code`
- `imagegen-frontend-mobile`
- `imagegen-frontend-web`
- `impeccable`
- `industrial-brutalist-ui`
- `investigate`
- `learn-codebase`
- `mem-search`
- `minimalist-ui`
- `pdf`
- `receiving-code-review`
- `redesign-existing-projects`
- `requesting-code-review`
- `stitch-design-taste`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `writing-plans`

### Codex System Skills

These live in `~/.codex/skills/.system`:

- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`

## Verification Rule

When testing a new shared install, the expected result is:

- Present in `~/.agents/skills/<skill>`
- Present as symlinks in Claude/OpenCode mirrors
- Not present in `~/.codex/skills/<skill>`

## Notes

- Backups for the shell/sync changes exist at:
  - `~/.zshrc.bak.skills`
  - `~/.agents/sync-skills.sh.bak`
- If an agent ever stops seeing newly installed shared skills, run:

```sh
~/.agents/sync-skills.sh
```
