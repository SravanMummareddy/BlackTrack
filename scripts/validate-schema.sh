#!/bin/sh
# validate-schema.sh — Validate schema files for syntax errors.

set -e

QUIET=0
if [ "$1" = "--quiet" ]; then QUIET=1; fi

log() {
  if [ $QUIET -eq 0 ]; then
    echo "$@"
  fi
}
fail() { echo "ERROR: $*" >&2; exit 1; }

ERRORS=0

# Check API schema JSON
API_SCHEMA=".shared/schemas/api-schema.json"
log "Validating $API_SCHEMA ..."
if [ -f "$API_SCHEMA" ]; then
  if node -e "JSON.parse(require('fs').readFileSync('$API_SCHEMA', 'utf8'))" 2>/dev/null; then
    log "  ✓ Valid JSON"
  else
    echo "  ✗ Invalid JSON in $API_SCHEMA"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ✗ $API_SCHEMA not found"
  ERRORS=$((ERRORS + 1))
fi

# Check DB schema SQL exists
DB_SCHEMA=".shared/schemas/database-schema.sql"
log "Checking $DB_SCHEMA ..."
if [ -f "$DB_SCHEMA" ]; then
  log "  ✓ Exists"
else
  echo "  ✗ $DB_SCHEMA not found"
  ERRORS=$((ERRORS + 1))
fi

# Check MCP servers JSON
MCP_SERVERS=".shared/mcp/servers.json"
log "Validating $MCP_SERVERS ..."
if [ -f "$MCP_SERVERS" ]; then
  if node -e "JSON.parse(require('fs').readFileSync('$MCP_SERVERS', 'utf8'))" 2>/dev/null; then
    log "  ✓ Valid JSON"
  else
    echo "  ✗ Invalid JSON in $MCP_SERVERS"
    ERRORS=$((ERRORS + 1))
  fi
else
  log "  (skipped — $MCP_SERVERS not found)"
fi

# Check package.json
log "Validating package.json ..."
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
  log "  ✓ Valid JSON"
else
  echo "  ✗ Invalid JSON in package.json"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -eq 0 ]; then
  log ""
  log "All schemas valid."
  exit 0
else
  echo ""
  echo "$ERRORS schema error(s) found."
  exit 1
fi
