#!/usr/bin/env bash
set -euo pipefail

# Determine repository root and API directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${SCRIPT_DIR}/backend/app"

UVICORN_BIN="${UVICORN_BIN:-uvicorn}"
UVICORN_HOST="${UVICORN_HOST:-0.0.0.0}"
UVICORN_PORT="${UVICORN_PORT:-5000}"
UVICORN_RELOAD="${UVICORN_RELOAD:-true}"
ENV_FILE="${ENV_FILE:-}"
APP_MODULE="${APP_MODULE:-main.main:app}"
CONDA_ENV_NAME="${CONDA_ENV_NAME:-web}"

if [[ ! -d "$API_DIR" ]]; then
  echo "Error: expected API directory at $API_DIR" >&2
  exit 1
fi

if [[ -n "$CONDA_ENV_NAME" ]]; then
  if ! command -v conda >/dev/null 2>&1; then
    echo "Error: conda not found but CONDA_ENV_NAME is set to '$CONDA_ENV_NAME'." >&2
    exit 1
  fi
  if ! conda run -n "$CONDA_ENV_NAME" --no-capture-output which "$UVICORN_BIN" >/dev/null 2>&1; then
    echo "Error: $UVICORN_BIN not found in conda environment '$CONDA_ENV_NAME'." >&2
    exit 1
  fi
else
  if ! command -v "$UVICORN_BIN" >/dev/null 2>&1; then
    echo "Error: $UVICORN_BIN not found. Activate your environment or install requirements." >&2
    exit 1
  fi
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

if [[ -n "$CONDA_ENV_NAME" ]]; then
  exec conda run -n "$CONDA_ENV_NAME" --no-capture-output "$UVICORN_BIN" "${UVICORN_ARGS[@]}"
else
  exec "$UVICORN_BIN" "${UVICORN_ARGS[@]}"
fi
