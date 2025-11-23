# Repository Guidelines

This guide outlines expectations for contributors working on the brand creator platform. The app uses the Next.js App Router (15.x) with TypeScript and Tailwind.

## Project Structure & Module Organization

The Next.js app lives in `src/app` (App Router) with route groups like `brandportal`, `creatorportal`, `find-creators`, and `login`. Shared UI is in `src/components`, utilities in `src/lib`, global styles in `src/styles`, and static assets in `public`. Prisma schema and migrations live under `prisma/` (PostgreSQL via `DATABASE_URL` / `DIRECT_URL`; `prisma/dev.db` is legacy). Legacy error fallbacks remain in `pages/`. FastAPI services live in `backend/app/main` (see `backend/README.md`); use `backend_local.sh` or `start_api_server.bat` to run locally after installing `backend/requirements.txt`.

## Build, Test, and Development Commands

- `npm run dev` – start the Next.js development server on port 3000.
- `npm run build` – produce an optimized production build.
- `npm run start` – serve the production build locally.
- `npm run lint` – run the eslint-config-next ruleset; keep the output clean (ESLint errors are ignored in production builds, so run this locally).
- `npm run prisma:migrate` – apply pending Prisma migrations; follow schema edits with `npm run prisma:generate`.
- `npm run prisma:seed` / `npm run db:seed` – populate the local database using `prisma/seed.js`.

## Coding Style & Naming Conventions

TypeScript with React function components is the default, with strict mode enabled. Follow the existing 2-space indentation, prefer PascalCase for components, camelCase for helpers, and kebab-case for route folders. Tailwind powers layout (config in `tailwind.config.ts`, includes `@tailwindcss/line-clamp`); extend design tokens there instead of ad-hoc CSS, and favor the `@/` alias for paths rooted at `src/`. ESLint uses `next/core-web-vitals` plus unused-var enforcement (prefix unused with `_`). Run `npm run lint` before pushing to catch formatting or type-safety issues.

## Testing Guidelines

No automated test harness is configured yet, so validate changes through linting, manual UI checks, and Prisma migrations. When adding tests, co-locate them beside the code (for example `component.test.tsx`) and document the command in your PR. Prioritize coverage around shared utilities in `src/lib` and high-traffic routes before merging large features.

## Commit & Pull Request Guidelines

Follow the Conventional Commit style seen in history (`feat:`, `fix:`, `chore:`, etc.) and keep subject lines under 72 characters. Each PR should explain the motivation, summarize key changes, list validation steps (commands run, screenshots for UI updates), and reference related issues or tickets. Keep scope narrow so reviewers can reason about the change quickly.

## Environment & Data Setup

Use PostgreSQL connection strings in `.env.local` (`DATABASE_URL` and `DIRECT_URL`). Copy `.env.example` if present, and fill in Supabase, email, and auth secrets before running dev servers. Regenerate the Prisma client after schema edits and commit migration snapshots stored in `prisma/migrations`. For the optional API service, install the FastAPI dependencies from `backend/requirements.txt` and rely on environment variables for credentials.
