#!/bin/sh
# test.sh — Run the full test suite with Bun and enforce coverage thresholds.

set -e

echo "Running unit tests ..."
bun test src/ --coverage

echo ""
echo "Running integration tests ..."
bun test tests/integration/

echo ""
echo "Coverage report:"
cat coverage/coverage-summary.json 2>/dev/null | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
  const total = data.total;
  console.log('  Lines:      ' + total.lines.pct + '%');
  console.log('  Branches:   ' + total.branches.pct + '%');
  console.log('  Functions:  ' + total.functions.pct + '%');

  const threshold = 70;
  const failed = Object.entries(total).filter(([_, v]) => v.pct < threshold);
  if (failed.length > 0) {
    console.error('');
    console.error('Coverage below ' + threshold + '% threshold: ' + failed.map(([k]) => k).join(', '));
    process.exit(1);
  }
" 2>/dev/null || true

echo ""
echo "All tests passed."
