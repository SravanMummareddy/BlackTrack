#!/bin/sh
# handoff.sh — Run before switching agents or ending a session.
# Validates project state, runs tests, and prompts for context update.

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

pass() { printf "${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "${YELLOW}⚠${RESET} %s\n" "$1"; }
fail() { printf "${RED}✗${RESET} %s\n" "$1"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$1"; }

ERRORS=0

header "=== Agent Handoff Checklist ==="

# 1. Git status
header "1. Git Status"
if git diff --quiet && git diff --cached --quiet; then
  pass "Working tree is clean"
else
  warn "Uncommitted changes present:"
  git status --short
  ERRORS=$((ERRORS + 1))
fi

# 2. TypeScript compilation
header "2. TypeScript Check"
if bun run typecheck 2>/dev/null; then
  pass "TypeScript compiles without errors"
else
  fail "TypeScript errors found — run 'bun run typecheck' for details"
  ERRORS=$((ERRORS + 1))
fi

# 3. Lint
header "3. Lint"
if bun run lint 2>/dev/null; then
  pass "No lint errors"
else
  warn "Lint errors found — run 'bun run lint' for details"
  ERRORS=$((ERRORS + 1))
fi

# 4. Tests
header "4. Test Suite"
if bun test --silent 2>/dev/null; then
  pass "All tests pass"
else
  fail "Tests failing — resolve before handoff"
  ERRORS=$((ERRORS + 1))
fi

# 5. Schema validation
header "5. Schema Validation"
if sh ./scripts/validate-schema.sh --quiet 2>/dev/null; then
  pass "Schemas are valid"
else
  warn "Schema validation issues found"
fi

# 6. Context file check
header "6. Context Files"
CONTEXT_FILE=".shared/context/CONTEXT.md"
TODO_FILE=".shared/context/TODO.md"

if [ -s "$CONTEXT_FILE" ]; then
  pass "CONTEXT.md exists and is non-empty"
else
  fail "CONTEXT.md is missing or empty — update it before handoff"
  ERRORS=$((ERRORS + 1))
fi

if [ -s "$TODO_FILE" ]; then
  pass "TODO.md exists and is non-empty"
else
  warn "TODO.md is empty"
fi

# Summary
header "=== Handoff Summary ==="
if [ $ERRORS -eq 0 ]; then
  printf "${GREEN}${BOLD}✓ Ready for handoff!${RESET}\n\n"
  printf "Next agent should:\n"
  printf "  1. /superpowers:using-superpowers\n"
  printf "  2. Read .shared/context/CONTEXT.md\n"
  printf "  3. Read .shared/context/TODO.md\n"
  printf "  4. /claude-mem:learn-codebase\n"
  printf "  5. Run: bun install && bun test\n\n"
else
  printf "${RED}${BOLD}✗ ${ERRORS} issue(s) must be resolved before handoff.${RESET}\n\n"
  exit 1
fi
