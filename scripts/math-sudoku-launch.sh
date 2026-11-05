#!/usr/bin/env bash
# Levanta Math Sudoku con Docker Compose (red host) y abre el juego en el navegador.
# Pensado para lanzarse desde wofi mediante scripts/math-sudoku.desktop.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
cd "$REPO_DIR"

export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.host.yml)
URL="http://localhost/"

notify() {
  if command -v notify-send >/dev/null 2>&1; then
    notify-send --app-name="Math Sudoku" "Math Sudoku" "$1" || true
  fi
}

fail() {
  notify "$1"
  echo "$1" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 || fail "Docker no está instalado."
docker info >/dev/null 2>&1 || fail "Docker no está disponible. ¿Está arrancado el servicio?"

notify "Iniciando el juego…"

if docker image inspect math-sudoku-backend:latest >/dev/null 2>&1 \
   && docker image inspect math-sudoku-frontend:latest >/dev/null 2>&1; then
  "${COMPOSE[@]}" up -d || fail "No se pudo levantar Docker Compose. Revisa los logs con: ${COMPOSE[*]} logs"
else
  LOG="${TMPDIR:-/tmp}/math-sudoku-launch.log"
  notify "Primera ejecución: construyendo imágenes (puede tardar)…"
  ./scripts/up-host.sh >"$LOG" 2>&1 || fail "Falló la construcción de imágenes. Revisa $LOG"
fi

# Espera a que el proxy de Nginx responda al healthcheck del backend.
for _ in $(seq 1 90); do
  if curl -fsS "http://localhost/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://localhost/api/health" >/dev/null 2>&1; then
  fail "El backend no respondió a tiempo. Prueba: ${COMPOSE[*]} logs"
fi

notify "Juego listo en $URL"
if [ "${MATH_SUDOKU_NO_OPEN:-0}" != "1" ]; then
  xdg-open "$URL" >/dev/null 2>&1 &
fi
