# Repository Guidelines

This guide outlines expectations for contributors working on the brand creator platform.

## Project Structure & Module Organization

The Next.js app lives in `src/app`, grouped by route folders such as `brandportal` and `creatorportal`. Shared interface elements sit in `src/components`, reusable utilities reside in `src/lib`, global styles in `src/styles`, and static assets in `public`. Prisma schema, migrations, and the SQLite `dev.db` live under `prisma/`, while legacy error fallbacks remain in `pages/` and optional FastAPI tooling in `backend/`.

## Build, Test, and Development Commands

- `npm run dev` – start the Next.js development server on port 3000.
- `npm run build` – produce an optimized production build.
- `npm run start` – serve the production build locally.
- `npm run lint` – run the eslint-config-next ruleset; keep the output clean.
- `npm run prisma:migrate` – apply pending Prisma migrations; follow schema edits with `npm run prisma:generate`.
- `npm run prisma:seed` – populate the local database using `prisma/seed.js`.

## Coding Style & Naming Conventions

TypeScript with React function components is the default. Follow the existing 2-space indentation, prefer PascalCase for components, camelCase for helpers, and kebab-case for route folders. Tailwind powers layout—extend design tokens via `tailwind.config.ts` instead of ad-hoc CSS—and favor the `@/` alias for paths rooted at `src/`. Run `npm run lint` before pushing to catch formatting or type-safety issues.

## Testing Guidelines

No automated test harness is configured yet, so validate changes through linting, manual UI checks, and Prisma migrations. When adding tests, co-locate them beside the code (for example `component.test.tsx`) and document the command in your PR. Prioritize coverage around shared utilities in `src/lib` and high-traffic routes before merging large features.

## Commit & Pull Request Guidelines

Follow the Conventional Commit style seen in history (`feat:`, `fix:`, `chore:`, etc.) and keep subject lines under 72 characters. Each PR should explain the motivation, summarize key changes, list validation steps (commands run, screenshots for UI updates), and reference related issues or tickets. Keep scope narrow so reviewers can reason about the change quickly.

## Environment & Data Setup

Copy `.env.example` (if present) to `.env.local`, filling in Supabase, email, and auth secrets before running dev servers. Regenerate the Prisma client after schema edits and commit migration snapshots stored in `prisma/migrations`. For the optional API service, install the FastAPI dependencies from `backend/requirements.txt` and rely on environment variables for credentials.
