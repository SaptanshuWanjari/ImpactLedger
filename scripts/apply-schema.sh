#!/usr/bin/env bash
set -euo pipefail

# Load .env.local automatically when running the script directly.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [[ -f "${PROJECT_ROOT}/.env.local" ]]; then
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env.local"
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required."
  echo "Example: export SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql

echo "Schema applied successfully."
