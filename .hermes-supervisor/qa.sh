#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-local}"

if [[ "$MODE" != "local" && "$MODE" != "--external" ]]; then
  printf 'Usage: %s [--external]\n' "$0" >&2
  exit 2
fi

cd "$ROOT"

passes=0
failures=0

run() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if "$@"; then
    printf 'PASS: %s\n' "$label"
    passes=$((passes + 1))
  else
    local status=$?
    printf 'FAIL: %s (exit %s)\n' "$label" "$status" >&2
    failures=$((failures + 1))
  fi
}

run "Repository and environment-template invariants" \
  node .hermes-supervisor/verify-repository.mjs
run "Mission acceptance verifier tests" \
  node --test .hermes-supervisor/verify-acceptance.test.mjs
run "TypeScript strict checks" npm run typecheck
run "Unit tests" npm run test
run "Production build" npm run build
run "ESLint (errors block; warnings are reported)" npm run lint
run "Playwright smoke tests" npm run test:e2e
run "Production dependency audit (high severity or above)" \
  npm audit --omit=dev --audit-level=high

if [[ "$MODE" == "--external" ]]; then
  run "Mission completion acceptance contract" \
    node .hermes-supervisor/verify-acceptance.mjs
  run "Production HTTP and webhook readiness" \
    node .hermes-supervisor/verify-production.mjs
fi

printf '\nQA SUMMARY: %s passed, %s failed\n' "$passes" "$failures"
if (( failures > 0 )); then
  exit 1
fi
