#!/usr/bin/env bash
# Runs the pgTAP suites against the local Supabase database with psql.
# Fallback for environments where `supabase test db` cannot pull its pg_prove image.
set -euo pipefail
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
status=0
for f in supabase/tests/database/*.test.sql; do
  out=$(psql "$DB_URL" -X -q -t -A -v ON_ERROR_STOP=1 -f "$f" 2>&1) || { echo "$out"; echo "FAILED (sql error): $f"; status=1; continue; }
  echo "$out" | grep -E '^(ok|not ok|# )' || true
  if echo "$out" | grep -qE '^not ok|Looks like'; then echo "FAILED: $f"; status=1; else echo "PASSED: $f"; fi
done
exit $status
