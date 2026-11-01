# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

The project is not scaffolded yet. It is planned as Vite + React + TypeScript (`npm create vite@latest . -- --template react-ts`). Once `package.json` exists, replace the commands below with the real scripts and add the test commands.

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # typecheck + production build -> dist/
npm run lint
npm run preview   # serve the production build locally
```

No test runner is set up yet. Use Vitest when one is added, to match the backend.

## Subagents

- `feature-builder` (`.claude/agents/feature-builder.md`): hand it any task that adds or extends a screen calling the Muhaid API. It reads the backend docs, translates them into this repo's layout, builds bottom-up, and runs build and lint before it reports back.

## The backend contract

The API lives in the sibling repo `../muhaid_backend` (NestJS, PostgreSQL). Read these before building any screen that calls it:

- `../muhaid_backend/docs/API.md`: the contract. Fields, validation rules, status codes and error shapes.
- `../muhaid_backend/docs/frontend/README.md`: shared client setup (`apiClient`, `ApiError`, `queryClient`, dates, RTL, route guards). Feature guides `01`–`07` in the same folder cover each endpoint group: types, API function, TanStack Query hook, screen and error handling.

Those guides assume a `features/<name>/` layout, MUI and file-based TanStack Router. **This repo does not use any of those.** Keep their logic but put the code where the layout below says.

Backend facts that shape the client:

- Base URL comes from `VITE_API_URL` (locally `http://localhost:3000`). There is **no `/api` prefix**, and the backend enables CORS, so no Vite proxy is needed. If the backend sets `CORS_ORIGIN`, it must include the Vite origin.
- Auth is a Bearer token only (no cookies, no refresh endpoint). `401` can arrive at any time, because the server reloads the user on every request. It means "log in again". `403` means wrong role or an unassigned template. It is not a logout.
- Calendar dates (`YYYY-MM-DD`) stay strings. Never pass them to `new Date()`. Date-times are sent with `toISOString()`.
- User-entered text is often Arabic: put `dir="auto"` on elements that show it.

## One app, two roles

This single app serves both clients described in the backend docs, and the user's role decides which one they get:

- **Inspector** (`inspector` role): calls `/web/*` routes, fills inspection forms on site, and **works offline**. The query cache is persisted to IndexedDB, and submitted inspections go into a Dexie outbox that syncs with a stable client-generated `id` (see "Offline sync flow" in `API.md` and `docs/frontend/03-web-inspections.md`).
- **Admin** (`admin` role): calls `/admin/*` routes to manage users, projects, templates and assignments, and to review inspections. It needs no offline support.

The role comes from `GET /auth/me`, never from decoding the token. Route guards send each role only to its own pages, because the other group's endpoints return `403`. Both roles share `/auth/*`.

The same resource names exist for both roles (templates, inspections) with different endpoints and shapes, so split API files, hooks and pages into `web/` and `admin/` subfolders instead of merging them.

## Source layout

```
src/
  api/          # the only code that touches apiClient: authApi.ts, web/*.ts, admin/*.ts
  components/   # reusable UI, one folder per component
  pages/        # one page per route: pages/web/..., pages/admin/..., pages/Login/
  hooks/        # TanStack Query hooks and other custom hooks, also split web/ and admin/
  lib/          # apiClient, apiError, queryClient, authToken, offline outbox
  types/        # API response types (api.ts holds the shared shapes from the backend guide)
  App.tsx       # providers, router, role guards
  main.tsx
```

Data flows one way: page or component → hook in `hooks/` → function in `api/` → `apiClient`. Components never call `apiClient` or axios directly. Each resource exports a query key factory (`usersKeys.all`, `.list(params)`, `.detail(id)`) so mutations invalidate consistently.

Reads use `useSuspenseQuery`, with a `SuspenseLoader` and an error boundary at the route level. Components don't check `isLoading`. Page changes in paginated lists go through `startTransition` so the current page stays visible while the next one loads.

## Components and styling

Every component lives in its own folder with its own CSS Module. There is no UI library.

```
components/
  Button/
    Button.tsx
    Button.module.css
    index.ts        # export { Button } from './Button';
```

- Import styles as `import styles from './Button.module.css'` and use `className={styles.root}`. Don't write global class names except in `src/index.css`, which holds resets and CSS variables (colors, spacing, fonts).
- A component's CSS file styles only that component. To change a child component's look, add a prop or a `className` prop to the child. Don't reach into it from the parent's CSS.
- Pages follow the same pattern: `pages/admin/Users/Users.tsx` + `Users.module.css`.
- The UI needs to support RTL. Use logical CSS properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`) instead of left/right.

## Conventions

- TypeScript strict, no `any`, `import type` for type-only imports, explicit return types on API functions and hooks.
- Prettier settings match the backend: single quotes, trailing commas.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
