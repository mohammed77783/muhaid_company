# Admin dashboard: projects

Endpoints: `POST /admin/projects`, `GET /admin/projects`, `GET /admin/projects/:id`, `PATCH /admin/projects/:id`. Role: `admin`. Contract: [API.md › Projects](../API.md#admin-projects).

A project groups templates. It has a unique `code` (`PRJ-2026-001`) and a free-text `name` (often Arabic). There is no delete.

```
features/projects/
  api/projectsApi.ts
  hooks/useProjects.ts
  hooks/useProject.ts
  hooks/useProjectMutations.ts
  components/ProjectsTable.tsx
  components/ProjectFormDialog.tsx
  components/ProjectDetail.tsx
  components/ProjectSelect.tsx   # reused by templates and inspections filters
  types/index.ts
```

Routes: `/projects`, `/projects/$id`.

## Types

```ts
import type { CalendarDate, IsoDateTime, PageParams } from '~types/api';

export interface Project {
  id: string;
  code: string;
  name: string;
  createdAt: IsoDateTime;
}

export interface ProjectDetail extends Project {
  templates: { id: string; name: string; validFrom: CalendarDate; validTo: CalendarDate | null }[];
}

export interface ProjectBody {
  code: string;
  name: string;
}

export type ListProjectsParams = PageParams; // only page and limit
```

## API layer

```ts
export const projectsApi = {
  create: async (body: ProjectBody): Promise<Project> =>
    (await apiClient.post<Project>('/admin/projects', body)).data,

  list: async (params: ListProjectsParams): Promise<Paginated<Project>> =>
    (await apiClient.get<Paginated<Project>>('/admin/projects', { params })).data,

  get: async (id: string): Promise<ProjectDetail> =>
    (await apiClient.get<ProjectDetail>(`/admin/projects/${id}`)).data,

  update: async (id: string, body: Partial<ProjectBody>): Promise<Project> =>
    (await apiClient.patch<Project>(`/admin/projects/${id}`, body)).data,
};

export const projectsKeys = {
  all: ['projects'] as const,
  list: (p: ListProjectsParams) => ['projects', 'list', p] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};
```

---

## `POST /admin/projects`

**What it does:** creates a project.

### How to build it

"New project" button → `ProjectFormDialog`:

| Field | Client rule |
| --- | --- |
| Code | trimmed, 1 to 50 characters, `/^[A-Za-z0-9_-]+$/`. Use a monospace font, and consider auto-uppercasing as the user types. |
| Name | trimmed, 1 to 200 characters, `dir="auto"` |

```ts
export function useCreateProject(): UseMutationResult<Project, ApiError, ProjectBody> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      void navigate({ to: '/projects/$id', params: { id: project.id } });
    },
  });
}
```

Going to the new project's page leads naturally to the next step: creating its first template.

### Errors

| Status | UI |
| --- | --- |
| `400` `Use letters, digits, "-" or "_" only` | Error on the code field. |
| `409` `A project with this code already exists` | Error on the code field. |

---

## `GET /admin/projects`

**What it does:** lists projects, newest first. Paginated. No filters.

### How to build it

`/projects` page: a table with code (monospace), name and created date. A row click opens `/projects/$id`. Paginate with `startTransition` (see README).

```ts
export function useProjects(params: ListProjectsParams): Paginated<Project> {
  const { data } = useSuspenseQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => projectsApi.list(params),
  });
  return data;
}
```

### `ProjectSelect`: the shared picker

The template form and the inspections filter both need a project dropdown. Build one `ProjectSelect` on this endpoint:

- Load `limit: 50`. If `total > 50`, use an MUI `Autocomplete` that loads more pages as the user scrolls (`useSuspenseInfiniteQuery`).
- Label each option `"{code} — {name}"`.
- The server has no text search, so filtering in the `Autocomplete` only works on what's loaded. That's fine for dozens of projects. If there are hundreds, add a search param to the API.

---

## `GET /admin/projects/:id`

**What it does:** returns one project and all its templates, sorted by name.

### How to build it

`/projects/$id` page:

1. **Header**: code, name, "Edit" button.
2. **Templates** table: name, valid from/to, and a status chip computed on the client from today's `YYYY-MM-DD` string:
   - **Upcoming**: `validFrom > today`
   - **Active**: within dates
   - **Ended**: `validTo < today`
3. A **"New template"** button that opens the template form with this project preselected (`/templates/new?projectId=…`).
4. A **"View inspections"** link to `/inspections?projectId=…` (see [07](07-admin-inspections.md)).

```ts
export function useProject(id: string): ProjectDetail {
  const { data } = useSuspenseQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsApi.get(id),
  });
  return data;
}
```

### Errors

`400` / `404` `Project not found`: route error boundary, "Project not found".

---

## `PATCH /admin/projects/:id`

**What it does:** updates `code` and/or `name`. Same rules as create, at least one field.

### How to build it

Reuse `ProjectFormDialog` in edit mode. Send only the fields that changed, and disable Save when none did.

```ts
export function useUpdateProject(id: string): UseMutationResult<Project, ApiError, Partial<ProjectBody>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => projectsApi.update(id, body),
    onSuccess: (project) => {
      queryClient.setQueryData<ProjectDetail>(projectsKeys.detail(id), (old) => (old ? { ...old, ...project } : old));
      void queryClient.invalidateQueries({ queryKey: ['projects', 'list'] });
      // Templates, inspections and users embed the project code and name.
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
      void queryClient.invalidateQueries({ queryKey: ['inspections'] });
      void queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}
```

When the **code** changes, show a note in the dialog: "Photos already uploaded stay in the folder named after the old code. New photos use the new code." It's harmless for the dashboard, which reads photos by inspection id, but it matters to anyone browsing the upload folder directly.

### Errors

`400` validation or `Nothing to update`, `404`, `409` duplicate code (show on the code field).
