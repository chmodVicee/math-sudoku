#!/usr/bin/env bash
# Detiene Math Sudoku. Los datos de PostgreSQL se conservan en el volumen.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
cd "$REPO_DIR"

export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

notify() {
  if command -v notify-send >/dev/null 2>&1; then
    notify-send --app-name="Math Sudoku" "Math Sudoku" "$1" || true
  fi
}

docker compose -f docker-compose.yml -f docker-compose.host.yml down
notify "Math Sudoku detenido. Los datos se conservan."
