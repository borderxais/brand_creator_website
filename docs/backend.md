# Backend

FastAPI Python sidecar for platform integrations and media handling.

See [architecture.md](architecture.md) for how it fits into the overall system.

---

## Purpose

The FastAPI service handles workloads that belong in Python rather than Node:

- TikTok API integration (creator info, video upload, OAuth)
- Supabase storage operations
- Business logic that depends on Python libraries

The Next.js app delegates to this service via its API routes (`src/app/api/**`). The FastAPI process is optional — the Next.js app degrades gracefully if it is not running locally.

---

## Entry Point

```
backend/
  app/
    main/
      main.py       # FastAPI application entry point
      routes/       # FastAPI routers
      services/     # Supabase + business logic
    legacy/         # Older scripts kept for reference (safe to delete later)
  requirements.txt
```

The FastAPI application is instantiated in `backend/app/main/main.py`. Routers live under `backend/app/main/routes/`; service modules under `backend/app/main/services/`.

For the route map, see [`backend/README.md`](../backend/README.md) — that file is the source of truth for endpoint documentation and is kept closer to the code.

---

## Run Scripts

Two helper scripts start the FastAPI server. Both live at the **repo root**:

| Script | Platform | Usage |
|--------|---------|-------|
| `start_api_server.sh` | macOS / Linux | `bash start_api_server.sh` |
| `start_api_server.bat` | Windows | `start_api_server.bat` |

Run these from the repo root after activating the Python virtual environment and installing dependencies (see Local Development below).

> **Note:** `backend/README.md` and `AGENTS.md` reference a `backend_local.sh` script. As of this writing that script does not exist in the repository; use `start_api_server.sh` at the repo root instead.

---

## Environment Variables

The FastAPI service reads its configuration from environment variables. See [`backend/README.md`](../backend/README.md) for the full list and required values.

At minimum you will need Supabase credentials and TikTok API keys in your `.env.local` (or shell environment) before the service can handle platform requests.

---

## Local Development

```bash
# 1. Create and activate a virtual environment
python -m venv backend/.venv
source backend/.venv/bin/activate   # Windows: backend\.venv\Scripts\activate

# 2. Install runtime dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI server
bash start_api_server.sh            # Windows: start_api_server.bat
```

> **Dev tooling (linting + type checking):** A `backend/requirements-dev.txt` will be added in a later harness PR (PR 6). At that point, also run `pip install -r backend/requirements-dev.txt` to get Ruff and mypy.

---

## When to Update

Update this file when:
- A new run script is added or the existing ones move.
- The entry point path changes.
- Required environment variables change (also update `backend/README.md`).
- The local dev setup steps change (e.g., when `requirements-dev.txt` lands in PR 6).
