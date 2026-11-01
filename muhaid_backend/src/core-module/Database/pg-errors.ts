// Postgres error codes (https://www.postgresql.org/docs/current/errcodes-appendix.html)
export const PG_RESTRICT_VIOLATION = '23001'; // raised by the forbid_update() trigger
export const PG_FOREIGN_KEY_VIOLATION = '23503';
export const PG_UNIQUE_VIOLATION = '23505';
export const PG_CHECK_VIOLATION = '23514';

export interface PgErrorInfo {
  code: string;
  constraint?: string;
}

// Drizzle wraps driver errors in DrizzleQueryError, so the pg fields sit on `cause`.
export function pgError(err: unknown): PgErrorInfo | undefined {
  for (let e: unknown = err; e instanceof Error; e = e.cause) {
    const { code, constraint } = e as { code?: unknown; constraint?: unknown };
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
      return {
        code,
        constraint: typeof constraint === 'string' ? constraint : undefined,
      };
    }
  }
  return undefined;
}
