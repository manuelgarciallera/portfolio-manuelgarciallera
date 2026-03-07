#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: npm run ship -- \"mensaje de commit\""
  exit 1
fi

MSG="$*"

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No hay cambios para commitear."
  exit 0
fi

echo "[1/4] Lint"
npm run lint

echo "[2/4] Stage"
git add -A

echo "[3/4] Commit"
if git diff --cached --quiet; then
  echo "No hay cambios staged tras lint."
  exit 0
fi
git commit -m "$MSG"

echo "[4/4] Push"
git push origin main

echo "Listo: commit + push completados."
