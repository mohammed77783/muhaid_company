# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See also [AGENTS.md](AGENTS.md) for how to reach production telemetry (NestJS Observe).

## Commands

```bash
npm run start:dev      # run with watch (PORT env var, default 3000)
npm run build          # nest build -> dist/
npm run start:prod     # node dist/main
npm run lint           # oxlint --type-aware src/ test/
npm run format         # prettier on src/ and test/
npm run test           # unit tests (vitest, **/*.spec.ts)
npm run test:e2e       # e2e tests (vitest, **/*.e2e-spec.ts, config: vitest.config.e2e.ts)
npx tsc -p tsconfig.build.json --noEmit   # typecheck only
```

Single test: `npx vitest run path/to/file.spec.ts` or filter by name with `-t "name"`. For an e2e file add `--config ./vitest.config.e2e.ts`.

## Stack and conventions

- NestJS 12, TypeScript 6, Express platform.
- **Native ESM** (`"type": "module"`, `module: nodenext`). Relative imports must use the `.js` extension (e.g. `import { AdminModule } from './admin-module/admin.module.js'`), even from `.ts` files. `main.ts` uses top-level `await`.
- Tests use Vitest with `globals: true` (`describe`/`it`/`expect` without imports), not Jest. E2E tests boot `AppModule` via `@nestjs/testing` and hit it with `supertest`.
- Lint is oxlint, not ESLint. `typescript/no-floating-promises` is an error, so every promise must be awaited or explicitly handled.
- Prettier: single quotes, trailing commas.
- `nest g ...` schematics may generate imports without `.js`; fix them after generating.
- Validation: **DTO classes only** (class-validator + class-transformer), never Zod. DTOs live in each feature's `dto/` folder, one class per file. The global `AppValidationPipe` (`APP_PIPE` in `CoreModule`) validates every `@Body()`/`@Query()` with `transform` + `whitelist`. 400s are Nest's default shape plus `data: []`. Shared helpers (`PaginationDto`, `@Trim`, `@IsoDateTime`, `@IsoDate`, `@IsOnOrAfter`, `NotEmptyBodyPipe` for PATCH) are in `src/core-module/Validation/`.
- Import DTOs in controllers as values, never `import type`: `ValidationPipe` reads the class from decorator metadata, and a type-only import silently skips validation. `useDefineForClassFields: false` in `tsconfig.json` keeps unset optional DTO fields from becoming own `undefined` keys.

## Architecture

The backend serves two separate clients, each with its own top-level feature module, plus a shared core module. All three are imported into `AppModule` (`src/app.module.ts`):

- `src/core-module/` — `CoreModule`: shared infrastructure used by both clients.
- `src/web-module/` — `WebModule`: API for the public front-end app.
- `src/admin-module/` — `AdminModule`: API for the admin dashboard.

Keep features for each client inside its module rather than in `AppModule`. The root `AppController`/`AppService` is the starter's `GET /` "Hello World!" endpoint, which `test/app.e2e-spec.ts` still asserts.

### Config and database (in `CoreModule`)

- `ConfigModule` is global and loads `.env.production` when `NODE_ENV=production`, otherwise `.env.development`. `drizzle.config.ts` uses the same rule.
- Drizzle ORM on PostgreSQL (`pg` Pool) lives in `src/core-module/Database/`. `DatabaseModule` is `@Global()`, so any module can inject the client without importing it:

  ```ts
  import { InjectDb, type Database } from '../core-module/Database/index.js';
  constructor(@InjectDb() private readonly db: Database) {}
  ```

- Tables go in `src/core-module/Database/schema/` and must be re-exported from `schema/index.ts`. That barrel feeds both the typed client and drizzle-kit.
- Migrations: `npm run db:generate` writes SQL to `drizzle/`, `npm run db:migrate` applies it (`db:push` syncs without migration files, `db:studio` opens the UI).
- The pool connects lazily, so the app boots without a reachable database, but it throws at startup if `DATABASE_URL` is missing.
