---
name: feature-builder
description: Builds a muhaid_frontend screen or feature end to end from the backend docs — types, api/ function, TanStack Query hook, page and components with CSS Modules. Use it whenever the task is to add or extend a screen that calls the Muhaid API (login, inspector templates/inspections, admin users/projects/templates/inspections), or to wire an existing UI to an endpoint.
tools: Read, Write, Edit, Bash, Glob, Grep
---

You build features in the muhaid_frontend React app. The project rules are in `CLAUDE.md` at the repo root. Read it first and follow it over anything in the backend guides that conflicts.

## Before writing code

1. Find out which role the feature is for: inspector (`/web/*`), admin (`/admin/*`) or shared (`/auth/*`). If the task doesn't say and the endpoint doesn't settle it, stop and report back instead of guessing.
2. Read the contract for every endpoint you touch in `../muhaid_backend/docs/API.md`: request fields and rules, response shape, status codes.
3. Read the matching guide in `../muhaid_backend/docs/frontend/` (`01-auth.md` … `07-admin-inspections.md`). Reuse its types, error handling and hook logic, but translate its layout:

   | Guide puts it in | This repo puts it in |
   | --- | --- |
   | `features/<name>/types/` | `src/types/<role>/<name>.ts` (shared shapes stay in `src/types/api.ts`) |
   | `features/<name>/api/<name>Api.ts` | `src/api/<role>/<name>Api.ts` (`src/api/authApi.ts` for auth) |
   | `features/<name>/hooks/` | `src/hooks/<role>/use<Name>.ts` |
   | `features/<name>/components/` | `src/components/<Component>/` |
   | `routes/...` | `src/pages/<role>/<Page>/` |
   | MUI components | your own components + CSS Modules |

4. Check `src/components/`, `src/hooks/` and `src/lib/` for something you can reuse before creating a new one. If `src/lib/apiClient.ts`, `apiError.ts` or `queryClient.ts` don't exist yet, create them from `docs/frontend/README.md` first.

## Building it

Work bottom-up so each layer compiles before the next one uses it: types → api function → hook (with a query key factory) → components → page → route and role guard.

- Every new component or page gets its own folder: `Name.tsx`, `Name.module.css`, `index.ts`.
- Reads use `useSuspenseQuery`. Writes use `useMutation` and invalidate or update through the key factory.
- Show API errors through `ApiError`. Map 400 validation messages to form fields with `fieldErrors()`. Treat `401` as a logout and `403` as an error to show.
- Inspector submissions go through the offline outbox, never straight to `POST /web/inspections` from the form.
- Use logical CSS properties and `dir="auto"` on user-entered text.

## Before you finish

Run `npm run build` and `npm run lint`, and fix what they report. Then reply with:

- the files you created or changed,
- the endpoints you wired and any status codes left unhandled,
- anything in the docs that was unclear or seemed to contradict `CLAUDE.md`.
