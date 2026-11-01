# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace layout

This directory is not a repository. It holds two independent git repos, each with its own `package.json`, `node_modules` and `CLAUDE.md`. Run commands from inside the repo you are working on, and read that repo's `CLAUDE.md` first. It has the commands and conventions.

- [muhaid_backend/](muhaid_backend/): NestJS 12 + Drizzle ORM + PostgreSQL API. Native ESM (relative imports need the `.js` extension), Vitest, oxlint, DTO classes only for validation (class-validator, never Zod).
- [muhaid_frontend/](muhaid_frontend/): Vite + React + TypeScript app with TanStack Query, Dexie (offline outbox) and CSS Modules (no UI library).

## How the two repos relate

- The backend docs are the API contract: [muhaid_backend/docs/API.md](muhaid_backend/docs/API.md) and the per-endpoint client guides in [muhaid_backend/docs/frontend/](muhaid_backend/docs/frontend/). A change to a backend endpoint, DTO or error shape needs a matching update there, and in the frontend's `src/api/` and `src/types/`.
- One frontend serves two roles. `inspector` calls `/web/*` and works offline. `admin` calls `/admin/*`. These map to the backend's `WebModule` and `AdminModule`. Both roles share `/auth/*`, and `CoreModule` holds the shared infrastructure.
- The API has no `/api` prefix and uses Bearer-token auth only. The frontend reads `VITE_API_URL` (locally `http://localhost:3000`). If the backend sets `CORS_ORIGIN`, it must include the Vite origin (`http://localhost:5173`).
- To run the full stack locally, start `npm run start:dev` in the backend (port 3000) and `npm run dev` in the frontend (port 5173).

## Things to know before trusting the sub-repo docs

- The "Status" section in `muhaid_frontend/CLAUDE.md` says the project is not scaffolded yet. That is stale: `package.json`, `src/`, `vite.config.ts` and ESLint config exist. Use the `package.json` scripts as the source of truth.
- The backend's `AGENTS.md` describes NestJS Observe production telemetry. It applies when a task depends on production behavior.
