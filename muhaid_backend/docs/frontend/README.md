# Frontend integration guide

How to build every Muhaid API endpoint into the two React clients. [`docs/API.md`](../API.md) is the contract: it lists fields, rules and status codes. These guides cover the client side: the types, the API function, the TanStack Query hook, the screen that uses it, and how each error should appear to the user.

| File | Client | Endpoints |
| --- | --- | --- |
| [01-auth.md](01-auth.md) | both | `POST /auth/login`, `GET /auth/me` |
| [02-web-templates.md](02-web-templates.md) | inspector app | `GET /web/templates`, `GET /web/templates/:id` |
| [03-web-inspections.md](03-web-inspections.md) | inspector app | `POST /web/inspections`, `GET /web/inspections`, `GET /web/inspections/:id`, `GET /web/inspections/:id/photo`, offline outbox |
| [04-admin-users.md](04-admin-users.md) | admin dashboard | `POST/GET /admin/users`, `GET/PATCH /admin/users/:id` |
| [05-admin-projects.md](05-admin-projects.md) | admin dashboard | `POST/GET /admin/projects`, `GET/PATCH /admin/projects/:id` |
| [06-admin-templates.md](06-admin-templates.md) | admin dashboard | template CRUD, assignments |
| [07-admin-inspections.md](07-admin-inspections.md) | admin dashboard | `GET /admin/inspections`, `GET /admin/inspections/:id`, `GET /admin/inspections/:id/photo` |

Read this file first. Everything below is shared by both apps, and the feature guides build on it.

---

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript (strict), MUI v7 |
| Data | TanStack Query v5, `useSuspenseQuery` for reads, `useMutation` for writes |
| Routing | TanStack Router, file-based, route components lazy-loaded |
| HTTP | One `axios` instance per app (`apiClient`) |
| Feedback | `useMuiSnackbar` |
| Offline (inspector app only) | Query cache persisted to IndexedDB, plus an IndexedDB outbox (Dexie) |

The rules that shape every guide:

- **Suspense first.** Reads use `useSuspenseQuery`. Components never check `isLoading` or return a spinner early. A `<SuspenseLoader>` boundary at the route or feature level shows the loading state, and an error boundary shows failures.
- **API calls live in `features/<name>/api/`.** Components call hooks, hooks call the API object, and only the API object touches `apiClient`.
- **Strict types.** No `any`, `import type` for types, explicit return types on API functions and hooks.

## Folder layout

Each app is organised by feature. The inspector app has `auth`, `templates` and `inspections`. The admin dashboard has `auth`, `users`, `projects`, `templates` and `inspections`.

```
src/
  lib/
    apiClient.ts          # axios instance, token header, 401 handling
    apiError.ts           # ApiError + toApiError()
    queryClient.ts        # QueryClient defaults
    authToken.ts          # read/write the stored token
  types/
    api.ts                # Paginated<T>, shared response shapes
  components/
    SuspenseLoader/
    ErrorFallback/
    AuthedImage/          # photo display (see 03 and 07)
  features/
    users/
      api/usersApi.ts
      hooks/useUsers.ts
      components/UsersTable.tsx
      types/index.ts
      index.ts
  routes/
    users/index.tsx
```

## Shared types (`src/types/api.ts`)

These shapes come straight from the "Shared response shapes" and "Pagination" sections of `API.md`. Both apps use the same file.

```ts
/** ISO 8601 UTC timestamp from the server, e.g. "2026-10-31T09:15:00.000Z". */
export type IsoDateTime = string;
/** Calendar date, exactly "YYYY-MM-DD". Never parse it with `new Date()`. */
export type CalendarDate = string;

export type Role = 'admin' | 'inspector';
export type AnswerValue = 'yes' | 'no' | 'na';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  /** Rows matching the filters across all pages. */
  total: number;
}

export interface PageParams {
  page?: number; // default 1
  limit?: number; // default 20, max 50
}

export interface ProjectRef {
  id: string;
  code: string;
  name: string;
}

export interface TemplateItem {
  id: string;
  position: number;
  label: string;
}

export interface InspectionSummary {
  id: string;
  workOrderNumber: string;
  filledAt: IsoDateTime;
  receivedAt: IsoDateTime;
  template: { id: string; name: string };
  project: ProjectRef;
  inspector: { id: string; name: string };
}

export interface InspectionAnswer {
  itemId: string;
  position: number;
  /** Question text as it was when the inspection was submitted. */
  label: string;
  answer: AnswerValue;
  note: string | null;
}

export interface InspectionDetail extends InspectionSummary {
  /** Path relative to the API base, e.g. "/web/inspections/<id>/photo". */
  photoUrl: string;
  answers: InspectionAnswer[];
}
```

## The HTTP client (`src/lib/apiClient.ts`)

There is no `/api` prefix. Every path in `API.md` is appended directly to the base URL.

```ts
import axios, { type AxiosInstance } from 'axios';
import { getToken, clearToken } from './authToken';
import { toApiError } from './apiError';

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. http://localhost:3000
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    const apiError = toApiError(err);
    // 401 means the token expired, or the account was deactivated or deleted.
    // There is no refresh endpoint, so the only fix is to log in again.
    if (apiError.status === 401 && getToken()) {
      clearToken();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(apiError);
  },
);
```

Three backend facts drive this file:

- **The token is the only credential.** It goes in `Authorization: Bearer …`. No cookies are involved, so `withCredentials` is not needed.
- **`401` can arrive at any time**, even with an unexpired token, because the server reloads the user on every request. An admin deactivating someone signs them out on their next call. The `auth:logout` event lets the auth feature reset state and redirect (see [01-auth.md](01-auth.md)).
- **`403` is not a logout.** It means the wrong role (an admin opening the inspector app) or, on submit, a template that is no longer assigned. Show it; don't clear the token.

Don't set `Content-Type` yourself. axios sets `application/json` for objects and lets the browser set the multipart boundary for `FormData`.

## Normalising errors (`src/lib/apiError.ts`)

The API returns four error body shapes (see "Errors" in `API.md`):

1. Nest's standard body: `{ statusCode, message: string, error }`.
2. Validation: `{ statusCode: 400, message: string[], error, data: [] }`.
3. Errors with extra fields and no `statusCode`: `{ message, invalidUserIds }` or `{ message, missing, unknown }`.
4. Auth: `{ message, statusCode }`.

Convert them all into one class so screens don't have to inspect raw bodies:

```ts
import { isAxiosError } from 'axios';

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when the request never reached the server. */
    public readonly status: number,
    /** Always a list: validation returns several messages, other errors one. */
    public readonly messages: string[],
    /** The raw body, for the extra fields (missing, unknown, invalidUserIds). */
    public readonly body: Record<string, unknown> = {},
  ) {
    super(messages.join('\n'));
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Worth retrying later: offline or a server failure. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (isAxiosError(err)) {
    if (!err.response) return new ApiError(0, ['No connection to the server']);
    const body = (err.response.data ?? {}) as Record<string, unknown>;
    const raw = body.message;
    const messages = Array.isArray(raw)
      ? raw.map(String)
      : [typeof raw === 'string' ? raw : err.message];
    return new ApiError(err.response.status, messages, body);
  }
  return new ApiError(0, [err instanceof Error ? err.message : String(err)]);
}
```

Always read `status` from the response, never from the body: shape 3 has no `statusCode`.

### Showing validation errors on a form

Validation messages start with the field path, for example `"email must be an email"` or `"answers.2.note is required when the answer is \"no\""`. Array rules start with `"each value in <field>"` instead, for example `"each value in items must be shorter than or equal to 500 characters"`. Map them to fields by their first word:

```ts
/** Groups validation messages by top-level field: { email: [...], password: [...] }. */
export function fieldErrors(error: ApiError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const msg of error.messages) {
    const field = msg.replace(/^each value in /, '').split(/[ .]/, 1)[0];
    (out[field] ??= []).push(msg);
  }
  return out;
}
```

Validate on the client with the same rules (lengths, required fields, dates) so most errors never reach the server, but keep this mapping: the server is the final authority.

## QueryClient defaults (`src/lib/queryClient.ts`)

```ts
import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from './apiError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 4xx never helps; retry only network errors and 5xx.
      retry: (count, error) => (error as ApiError).isRetryable && count < 2,
    },
    mutations: { retry: false },
  },
});
```

### Query key convention

Each feature exports a key factory, so invalidation stays consistent:

```ts
export const usersKeys = {
  all: ['users'] as const,
  list: (params: ListUsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};
```

After a mutation, invalidate `usersKeys.all` to refresh every list and detail, or set the detail directly from the response when the endpoint returns the updated object (most `PATCH` and `POST` routes do).

## Pagination with Suspense

`useSuspenseQuery` suspends whenever the key changes, so moving to page 2 would blank the table. Wrap the page change in `startTransition` and React keeps showing the current page until the next one is ready:

```tsx
const [params, setParams] = useState<ListUsersParams>({ page: 1, limit: 20 });
const [isPending, startTransition] = useTransition();
const { data } = useUsers(params);

const handlePageChange = useCallback((_: unknown, page: number) => {
  startTransition(() => setParams((p) => ({ ...p, page: page + 1 })));
}, []);

<TablePagination
  count={data.total}
  page={data.page - 1}            // MUI is 0-based, the API is 1-based
  rowsPerPage={data.limit}
  rowsPerPageOptions={[10, 20, 50]} // the API rejects limit > 50
  onPageChange={handlePageChange}
/>
// Use isPending to dim the table while the next page loads.
```

Store `page`, `limit` and the filters in the URL search params (TanStack Router `validateSearch`) so a refresh or a shared link reopens the same view.

## Dates

| Kind | Format | Client rule |
| --- | --- | --- |
| Calendar date (`validFrom`, `validTo`) | `YYYY-MM-DD` | Keep it as a string. `new Date('2026-10-31')` is UTC midnight and shows as the previous day in negative offsets. Use `<input type="date">` or MUI X `DatePicker` with `format('YYYY-MM-DD')`. |
| Date-time (`filledAt`, `from`, `to`) | ISO 8601 with offset | Send `date.toISOString()`. It always ends in `Z`, which avoids the `+` encoding problem in query strings. |
| Response timestamps | ISO UTC string | Display with `Intl.DateTimeFormat` in the user's locale and timezone. |

## Arabic and RTL

Project names, template names, questions and notes are often Arabic. Set `dir="auto"` on any element that shows user-entered text, and if the UI itself is Arabic, create the MUI theme with `direction: 'rtl'` and use `stylis-plugin-rtl`.

## Route guards

Both apps load the current user once (see [01-auth.md](01-auth.md)) and guard routes by role:

- Inspector app: only `inspector`. An admin who logs in sees a "this app is for inspectors" screen, because every `/web/*` call would return `403`.
- Admin dashboard: only `admin`.

The role comes from `GET /auth/me`, never from decoding the token. The server reads the role from the database, so the token's `role` claim can be out of date.
