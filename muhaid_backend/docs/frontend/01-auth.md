# Auth (both apps)

Endpoints: `POST /auth/login`, `GET /auth/me`. Contract: [API.md › Auth](../API.md#auth).

Both apps use this feature unchanged. Only the required role differs.

```
features/auth/
  api/authApi.ts
  hooks/useCurrentUser.ts
  hooks/useLogin.ts
  hooks/useLogout.ts
  components/LoginForm.tsx
  components/RequireRole.tsx
  types/index.ts
```

## Types

```ts
import type { Role } from '~types/api';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: CurrentUser;
}
```

## API layer

```ts
import { apiClient } from '@/lib/apiClient';
import type { CurrentUser, LoginBody, LoginResponse } from '../types';

export const authApi = {
  login: async (body: LoginBody): Promise<LoginResponse> =>
    (await apiClient.post<LoginResponse>('/auth/login', body)).data,

  me: async (): Promise<CurrentUser> =>
    (await apiClient.get<CurrentUser>('/auth/me')).data,
};

export const authKeys = { me: ['auth', 'me'] as const };
```

## Token storage (`src/lib/authToken.ts`)

```ts
const KEY = 'muhaid.token';

export const getToken = (): string | null => localStorage.getItem(KEY);
export const setToken = (t: string): void => localStorage.setItem(KEY, t);
export const clearToken = (): void => localStorage.removeItem(KEY);
```

`localStorage` is the practical choice here. The inspector app has to survive a reload with no network, and the API takes a bearer header, not a cookie. Keep the XSS surface small to match: never render user text as HTML, and set a strict Content-Security-Policy.

---

## `POST /auth/login`

**What it does:** exchanges email and password for a token and the user object. Public.

### How to build it

1. A login route (`/login`) with a `LoginForm`: email field, password field, submit button.
2. Client-side checks that match the server: email format, password 1 to 200 characters. Trim the email. The server also lower-cases it, so case doesn't matter.
3. On submit, call `useLogin`. On success:
   - store `accessToken`,
   - put `user` straight into the cache under `authKeys.me`, so the app doesn't need an extra `/auth/me` call,
   - check the role for this app (see [Wrong role](#wrong-role)),
   - navigate to the page the user was trying to open, or home.

```ts
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { setToken } from '@/lib/authToken';
import type { ApiError } from '@/lib/apiError';
import { authApi, authKeys } from '../api/authApi';
import type { LoginBody, LoginResponse } from '../types';

export function useLogin(): UseMutationResult<LoginResponse, ApiError, LoginBody> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ accessToken, user }) => {
      setToken(accessToken);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}
```

In the form, disable the button with `mutation.isPending`. That is mutation state, not a loading early-return, so it fits the Suspense rule.

### Errors

| Status | UI |
| --- | --- |
| `400` | Show field errors with `fieldErrors()` from the README. Rare if client validation is in place. |
| `401` `Invalid email or password` | One message under the form: "Email or password is incorrect." Don't try to tell the cases apart: the server deliberately gives unknown emails, wrong passwords and **deactivated accounts** the same response. |
| network (`status 0`) | "Can't reach the server. Check your connection." |

The `apiClient` 401 interceptor only logs out when a token is already stored, so a failed login doesn't fire a logout event.

### Token lifetime

The token lasts `JWT_EXPIRES_IN` (default 8 hours) and **cannot be refreshed**. When it expires, the next request returns `401` and the user has to log in again. To warn before that happens, decode the `exp` claim (with `jwt-decode`, for display only) and show "Your session ends in 10 minutes" in the app bar. This matters most in the inspector app, where unsynced forms wait for the user to log in again.

---

## `GET /auth/me`

**What it does:** returns the signed-in user, freshly loaded from the database. Any role.

### How to build it

Call it once at app start, through a root-level suspense query. It answers two questions: is the stored token still valid, and what is the user's current role?

```ts
import { useSuspenseQuery } from '@tanstack/react-query';
import { authApi, authKeys } from '../api/authApi';
import type { CurrentUser } from '../types';

export function useCurrentUser(): CurrentUser {
  const { data } = useSuspenseQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  });
  return data;
}
```

Wire it into the router:

- The root route's `beforeLoad` redirects to `/login` when `getToken()` is null, so no request is made without a token.
- Authenticated routes sit under a layout route that renders `<RequireRole role="inspector">` (or `"admin"`), which calls `useCurrentUser()` inside a `<SuspenseLoader>`.
- If `/auth/me` returns `401`, the interceptor clears the token and fires `auth:logout`. The root listens for it and navigates to `/login`.

```tsx
interface RequireRoleProps {
  role: Role;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
  const user = useCurrentUser();
  return user.role === role ? <>{children}</> : <WrongRoleScreen expected={role} />;
};
```

### Wrong role

The same account system serves both apps:

- An admin who signs into the inspector app gets `403` on every `/web/*` call.
- An inspector who signs into the dashboard gets `403` on every `/admin/*` call.

Check `user.role` right after login and on startup, and show a clear screen ("This app is for inspectors. Sign in with an inspector account.") with a logout button, instead of letting every query fail.

Role changes take effect on the server immediately. If an admin promotes an inspector while the inspector app is open, the next `/web/*` call returns `403`. Handle that globally: on any `403` from a `/web/*` query, invalidate `authKeys.me`, and `RequireRole` will show the wrong-role screen.

### Offline (inspector app)

When the device is offline, `/auth/me` fails with a network error, not a `401`. Don't log the user out for that. Persist `authKeys.me` with the rest of the query cache (see [03-web-inspections.md](03-web-inspections.md#offline-setup)) so the app opens from cache, and only treat a real `401` as signed out.

---

## Logout

There is no logout endpoint, because tokens are stateless. Logging out is client-only:

```ts
export function useLogout(): () => void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(() => {
    clearToken();
    queryClient.clear();
    void navigate({ to: '/login' });
  }, [queryClient, navigate]);
}
```

In the inspector app, **don't clear the outbox on logout** if the same inspector may log back in. If unsynced forms exist, warn first: "3 inspections have not been sent yet. Log out anyway?" Outbox entries carry the inspector's user id, so another inspector on the same device doesn't send someone else's forms (see [03-web-inspections.md](03-web-inspections.md)).
