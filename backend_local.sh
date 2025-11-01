#!/usr/bin/env bash
set -euo pipefail

# Determine repository root and API directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${SCRIPT_DIR}/src/app/api"

UVICORN_BIN="${UVICORN_BIN:-uvicorn}"
UVICORN_HOST="${UVICORN_HOST:-0.0.0.0}"
UVICORN_PORT="${UVICORN_PORT:-5000}"
UVICORN_RELOAD="${UVICORN_RELOAD:-true}"
ENV_FILE="${ENV_FILE:-}"
APP_MODULE="${APP_MODULE:-main.main:app}"

if [[ ! -d "$API_DIR" ]]; then
  echo "Error: expected API directory at $API_DIR" >&2
  exit 1
fi

if ! command -v "$UVICORN_BIN" >/dev/null 2>&1; then
  echo "Error: uvicorn not found. Activate your environment or install requirements." >&2
  exit 1
fi

UVICORN_ARGS=("$APP_MODULE" --host "$UVICORN_HOST" --port "$UVICORN_PORT")
if [[ "${UVICORN_RELOAD,,}" == "true" ]]; then
  UVICORN_ARGS+=(--reload)
fi

if [[ -n "$ENV_FILE" ]]; then
  UVICORN_ARGS+=(--env-file "$ENV_FILE")
elif [[ -f "$API_DIR/.env.local" ]]; then
  UVICORN_ARGS+=(--env-file "$API_DIR/.env.local")
elif [[ -f "$API_DIR/.env" ]]; then
  UVICORN_ARGS+=(--env-file "$API_DIR/.env")
fi

cd "$API_DIR"

echo "Starting backend server with ${UVICORN_BIN} ${APP_MODULE} on ${UVICORN_HOST}:${UVICORN_PORT}"

exec "$UVICORN_BIN" "${UVICORN_ARGS[@]}"
