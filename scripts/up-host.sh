#!/usr/bin/env bash
# Levanta el juego con Docker Compose usando la red del host.
# Pensado para equipos donde Docker no puede crear redes bridge
# ("failed to create endpoint ... operation not supported").
set -euo pipefail

cd "$(dirname "$0")/.."

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.host.yml)
BAKE_FILE="$(mktemp)"
trap 'rm -f "$BAKE_FILE"' EXIT

echo "==> Generando definición de build..."
"${COMPOSE[@]}" build --print > "$BAKE_FILE"

echo "==> Construyendo imágenes (con permiso network.host)..."
docker buildx bake --allow=network.host -f "$BAKE_FILE"

echo "==> Levantando servicios..."
"${COMPOSE[@]}" up -d

echo
"${COMPOSE[@]}" ps
echo
echo "Juego:   http://localhost"
echo "API:     http://localhost:8090/api/health"
echo "Postgres localhost:5434 (mathsudoku/mathsudoku)"
