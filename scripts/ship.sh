#!/usr/bin/env bash
set -euo pipefail

suggest_message() {
  local files
  files="$(git diff --cached --name-only)"

  if echo "$files" | grep -q "src/components/PortfolioPreview.jsx\|src/app/page.tsx"; then
    echo "feat: align homepage with portfolio preview reference"
    return
  fi

  if echo "$files" | grep -q "scripts/ship.sh\|package.json\|README.md"; then
    echo "chore: improve automation workflow for ship command"
    return
  fi

  if echo "$files" | grep -q "src/components/\|src/styles/\|src/hooks/"; then
    echo "feat: refine portfolio UI sections and interactions"
    return
  fi

  echo "chore: update project files"
}

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No hay cambios para commitear."
  exit 0
fi

echo "[1/4] Lint"
npm run lint

echo "[2/4] Stage"
git add -A

if git diff --cached --quiet; then
  echo "No hay cambios staged tras lint."
  exit 0
fi

MSG="${*:-}"

if [[ -z "$MSG" ]] || [[ "$MSG" =~ ^[Mm]ensaje\ de\ commit$ ]]; then
  MSG="$(suggest_message)"
  echo "Mensaje automático: $MSG"
fi

echo "[3/4] Commit"
git commit -m "$MSG"

echo "[4/4] Push"
git push origin main

echo "Listo: commit + push completados."
