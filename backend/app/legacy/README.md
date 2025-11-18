This directory contains legacy Python services that used to live under `src/app/api`.

- `campaigns/`: Original FastAPI App Engine deployment for campaign CRUD + uploads

They now live under `backend/app/legacy` to keep the Next.js `/api` folder focused on route handlers. Update scripts or delete this folder when the legacy service is sunset.
