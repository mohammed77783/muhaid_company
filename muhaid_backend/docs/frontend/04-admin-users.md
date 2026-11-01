# Admin dashboard: users

Endpoints: `POST /admin/users`, `GET /admin/users`, `GET /admin/users/:id`, `PATCH /admin/users/:id`. Role: `admin`. Contract: [API.md › Users](../API.md#admin-users).

Users are never deleted, only deactivated. The UI therefore has **no delete button**, only an active/inactive switch.

```
features/users/
  api/usersApi.ts
  hooks/useUsers.ts
  hooks/useUser.ts
  hooks/useCreateUser.ts
  hooks/useUpdateUser.ts
  components/UsersTable.tsx
  components/UserFormDialog.tsx
  components/UserDetail.tsx
  types/index.ts
```

Routes: `/users` (list), `/users/$id` (detail).

## Types

```ts
import type { CalendarDate, IsoDateTime, PageParams, ProjectRef, Role } from '~types/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: IsoDateTime;
}

export interface UserTemplate {
  id: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null;
  project: ProjectRef;
  assignedAt: IsoDateTime;
}

export interface UserDetail extends User {
  templates: UserTemplate[];
}

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: Role; // default 'inspector'
}

/** Send only what changed. Email can never be changed. */
export type UpdateUserBody = Partial<Pick<User, 'name' | 'role' | 'isActive'>> & { password?: string };

export interface ListUsersParams extends PageParams {
  role?: Role;
  isActive?: boolean;
}
```

## API layer

```ts
export const usersApi = {
  create: async (body: CreateUserBody): Promise<User> =>
    (await apiClient.post<User>('/admin/users', body)).data,

  list: async ({ isActive, ...rest }: ListUsersParams): Promise<Paginated<User>> =>
    (await apiClient.get<Paginated<User>>('/admin/users', {
      // The server accepts only the strings "true" and "false".
      params: { ...rest, ...(isActive === undefined ? {} : { isActive: String(isActive) }) },
    })).data,

  get: async (id: string): Promise<UserDetail> =>
    (await apiClient.get<UserDetail>(`/admin/users/${id}`)).data,

  update: async (id: string, body: UpdateUserBody): Promise<User> =>
    (await apiClient.patch<User>(`/admin/users/${id}`, body)).data,
};

export const usersKeys = {
  all: ['users'] as const,
  list: (p: ListUsersParams) => ['users', 'list', p] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
};
```

---

## `POST /admin/users`

**What it does:** creates an admin or an inspector.

### How to build it

An "Add user" button on `/users` opens `UserFormDialog` in create mode.

| Field | Control | Client rule |
| --- | --- | --- |
| Name | text, `dir="auto"` | trimmed, 1 to 200 characters |
| Email | `type="email"` | valid email; trim and lower-case before sending |
| Password | password field with a "generate" button | 8 to 200 characters |
| Role | radio: Inspector (default) / Admin | |

```ts
export function useCreateUser(): UseMutationResult<User, ApiError, CreateUserBody> {
  const queryClient = useQueryClient();
  const { showSuccess } = useMuiSnackbar();
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
      showSuccess(`${user.name} was created`);
    },
  });
}
```

After success, close the dialog. Then either show the generated password once so the admin can pass it on, or go to `/users/$id` to assign templates straight away. Inspectors can't do anything until they are assigned.

### Errors

| Status | UI |
| --- | --- |
| `400` | Field errors via `fieldErrors()`. |
| `409` `A user with this email already exists` | Error on the email field. The check ignores case: `Ahmed@x.com` and `ahmed@x.com` clash. |

---

## `GET /admin/users`

**What it does:** lists users, newest first. Paginated. Filters: `role` and `isActive`.

### How to build it

`/users` page: a filter bar above an MUI `Table` (or MUI X `DataGrid`, lazy-loaded).

```ts
export function useUsers(params: ListUsersParams): Paginated<User> {
  const { data } = useSuspenseQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
  return data;
}
```

- **Filters**: Role (All / Admin / Inspector) and Status (All / Active / Inactive) as toggle buttons. "All" means the param is left out. Changing a filter resets `page` to 1.
- **Columns**: name, email, role chip, status chip, created date. Grey out inactive rows.
- **Row click** goes to `/users/$id`.
- **Pagination** with `startTransition`, `rowsPerPageOptions={[10, 20, 50]}` (see README).
- **Search params**: `?role=inspector&isActive=true&page=2`, validated in the route's `validateSearch`.

There is no name or email search on the server. Don't fake one by filtering only the current page: it hides matches on other pages. If search is needed, it has to be added to the API first.

### Also used by the assignment picker

The "Assign inspectors" dialog in [06-admin-templates.md](06-admin-templates.md) calls this endpoint with `role: 'inspector', isActive: true, limit: 50`, because only active inspectors can be assigned.

---

## `GET /admin/users/:id`

**What it does:** returns one user and the templates assigned to them (expired ones included), sorted by project code, then template name.

### How to build it

`/users/$id` page, in two sections:

1. **Profile card**: name, email, role, status, created date, and an "Edit" button (opens `UserFormDialog` in edit mode).
2. **Assigned templates**: a table with project code and name, template name, validity, and assigned date. Mark expired templates (`validTo < today`, compared as strings) with an "Expired" chip. Link each row to `/templates/$id`, where assignments are managed.

```ts
export function useUser(id: string): UserDetail {
  const { data } = useSuspenseQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
  });
  return data;
}
```

For an admin, hide the templates section: admins can't fill forms, so assignments don't apply. The array is usually empty for them, but it can hold leftovers from before a promotion (see below).

### Errors

`400` (bad UUID in the URL) and `404` `User not found` both show "User not found" in the route's error boundary.

---

## `PATCH /admin/users/:id`

**What it does:** changes `name`, `role`, `isActive` or `password`. Send only changed fields, at least one.

### How to build it

Three entry points, all using one hook:

```ts
export function useUpdateUser(id: string): UseMutationResult<User, ApiError, UpdateUserBody> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => usersApi.update(id, body),
    onSuccess: (user) => {
      // The response has no `templates`; merge so the detail page keeps them.
      queryClient.setQueryData<UserDetail>(usersKeys.detail(id), (old) => (old ? { ...old, ...user } : old));
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}
```

1. **Edit dialog** (name, role). Build the body by diffing the form against the loaded user, and disable Save when nothing changed. That avoids the server's `400 Nothing to update`. Show email as read-only text: sending it does nothing.
2. **Active switch** on the detail page. Ask for confirmation before deactivating: "Ahmed will be signed out immediately and can't be assigned to forms. Their inspections are kept." The confirmation matters because a deactivated user's token stops working on their next request, and any unsynced forms on their device will fail with `401` until they are reactivated.
3. **Reset password** action: a dialog with one password field (8 to 200 characters). Send `{ password }` only.

### Protect the admin from locking themselves out

The server rejects an admin deactivating themselves or removing their own admin role (`400`). Prevent it in the UI as well: when `user.id === currentUser.id`, disable the active switch and the role field, with a tooltip explaining why.

### Errors

| Status | UI |
| --- | --- |
| `400` validation / `Nothing to update` | Field errors, or nothing if the diff check works. |
| `400` `You cannot deactivate yourself or remove your own admin role` | Snackbar error (shouldn't happen with the UI guard). |
| `404` `User not found` | Snackbar, then go back to `/users`. |

### Side effects to show the admin

- **Changing an inspector to admin** keeps their assignments, but they can no longer use the inspector app. Warn in the confirmation.
- **Deactivated inspectors** keep their assignments but can't receive new ones. In the assignment picker they don't appear, because it filters `isActive: true`.
