# Admin dashboard: templates and assignments

Endpoints: `POST /admin/templates`, `GET /admin/templates`, `GET /admin/templates/:id`, `PATCH /admin/templates/:id`, `POST /admin/templates/:id/assignments`, `DELETE /admin/templates/:id/assignments/:userId`. Role: `admin`. Contract: [API.md › Templates and assignments](../API.md#admin-templates-and-assignments).

A template (نموذج التفتيش) is an inspection form: a project, a name, validity dates, and an ordered list of questions (بنود). Inspectors see a template only when it is **assigned** to them and valid.

**The key rule:** a template's questions can be replaced only while it has **no** submitted inspections (`inspectionCount === 0`). After that, the dates and name can still change, but the questions are locked. This rule shapes the whole editor.

```
features/templates/
  api/templatesApi.ts
  hooks/useTemplates.ts
  hooks/useTemplate.ts
  hooks/useTemplateMutations.ts
  hooks/useAssignments.ts
  components/TemplatesTable.tsx
  components/TemplateEditor/
    TemplateEditor.tsx
    ItemsEditor.tsx          # sortable question list
  components/TemplateDetail.tsx
  components/AssigneesPanel.tsx
  components/AssignInspectorsDialog.tsx
  types/index.ts
```

Routes: `/templates`, `/templates/new`, `/templates/$id`, `/templates/$id/edit`.

## Types

```ts
import type { CalendarDate, IsoDateTime, PageParams, ProjectRef, TemplateItem } from '~types/api';

export interface TemplateSummary {
  id: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null;
  createdAt: IsoDateTime;
  project: ProjectRef;
}

export interface Assignee {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  assignedAt: IsoDateTime;
}

export interface TemplateDetail extends TemplateSummary {
  items: TemplateItem[];  // sorted by position
  assignees: Assignee[];  // sorted by name
  /** > 0 means `items` can no longer be replaced. */
  inspectionCount: number;
}

export interface CreateTemplateBody {
  projectId: string;
  name: string;
  validFrom: CalendarDate;
  validTo?: CalendarDate | null;
  /** Question texts. Array order = position (first entry gets position 1). */
  items: string[];
}

export type UpdateTemplateBody = Partial<Omit<CreateTemplateBody, 'projectId'>>;

export interface ListTemplatesParams extends PageParams {
  projectId?: string;
}
```

The project can't be changed after creation: `UpdateTemplateBody` has no `projectId`.

## API layer

```ts
export const templatesApi = {
  create: async (body: CreateTemplateBody): Promise<TemplateDetail> =>
    (await apiClient.post<TemplateDetail>('/admin/templates', body)).data,

  list: async (params: ListTemplatesParams): Promise<Paginated<TemplateSummary>> =>
    (await apiClient.get<Paginated<TemplateSummary>>('/admin/templates', { params })).data,

  get: async (id: string): Promise<TemplateDetail> =>
    (await apiClient.get<TemplateDetail>(`/admin/templates/${id}`)).data,

  update: async (id: string, body: UpdateTemplateBody): Promise<TemplateDetail> =>
    (await apiClient.patch<TemplateDetail>(`/admin/templates/${id}`, body)).data,

  assign: async (id: string, userIds: string[]): Promise<Assignee[]> =>
    (await apiClient.post<Assignee[]>(`/admin/templates/${id}/assignments`, { userIds })).data,

  unassign: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/templates/${id}/assignments/${userId}`);
  },
};

export const templatesKeys = {
  all: ['templates'] as const,
  list: (p: ListTemplatesParams) => ['templates', 'list', p] as const,
  detail: (id: string) => ['templates', 'detail', id] as const,
};
```

---

## `POST /admin/templates`

**What it does:** creates a template and all its questions in one request. Returns the full template detail.

### How to build it

Route `/templates/new` (optionally `?projectId=…` from the project page) renders `TemplateEditor`:

| Field | Control | Client rule |
| --- | --- | --- |
| Project | `ProjectSelect` (from [05](05-admin-projects.md)) | required |
| Name | text, `dir="auto"` | trimmed, 1 to 200 characters |
| Valid from | date picker → `"YYYY-MM-DD"` | required |
| Valid to | date picker + "No end date" checkbox | optional; `>= validFrom` |
| Questions | `ItemsEditor` | 1 to 50 rows, each trimmed, 1 to 500 characters |

**`ItemsEditor`** is the centrepiece of this screen:

- One text field per question (multi-line, `dir="auto"`), with a row number that reflects its future `position`.
- Add, remove, and drag to reorder (`@dnd-kit/sortable`). **Array order is the display order**, so what the admin sees is what inspectors get.
- Paste multiple lines into the last field to split them into several questions. Admins often copy checklists from Word or Excel.
- A counter, "12 / 50", that disables "Add" at 50.
- Keep a stable client-side key per row (`crypto.randomUUID()` when the row is added), so reordering doesn't confuse React. Send only the strings.

Dates: compare `"YYYY-MM-DD"` strings directly, don't build `Date` objects. Send `validTo: null` (or leave it out) when "No end date" is checked.

```ts
export function useCreateTemplate(): UseMutationResult<TemplateDetail, ApiError, CreateTemplateBody> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: templatesApi.create,
    onSuccess: (tpl) => {
      queryClient.setQueryData(templatesKeys.detail(tpl.id), tpl);
      void queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['projects', 'detail', tpl.project.id] });
      void navigate({ to: '/templates/$id', params: { id: tpl.id } });
    },
  });
}
```

After creating, land on the detail page with the assignees panel visible: a new template does nothing until inspectors are assigned. A short hint helps: "Next: assign inspectors."

### Errors

| Status | UI |
| --- | --- |
| `400` | Field errors. Question errors arrive as `each value in items must be …` **without a row number**, so the client-side check in `ItemsEditor` has to mark the bad rows itself. Show the server message above the list. `validTo must be on or after validFrom` goes on the Valid to field. |
| `404` `Project not found` | The selected project disappeared (unlikely, since projects can't be deleted). Snackbar. |

---

## `GET /admin/templates`

**What it does:** lists templates, newest first. Paginated. Optional `projectId` filter. List entries have **no items or assignees**.

### How to build it

`/templates` page: a `ProjectSelect` filter (with an "All projects" option) above a table.

```ts
export function useTemplates(params: ListTemplatesParams): Paginated<TemplateSummary> {
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.list(params),
    queryFn: () => templatesApi.list(params),
  });
  return data;
}
```

Columns: template name, project (`code — name`), valid from, valid to (or "—"), a status chip (Upcoming / Active / Ended, computed from today's date string), created date. A row click opens `/templates/$id`. Paginate with `startTransition` and keep `projectId` and `page` in the URL.

The list doesn't include the question count or assignee count. Don't fetch each detail just to fill a column (that would be N+1 requests per page). If those columns are needed, add them to the API.

---

## `GET /admin/templates/:id`

**What it does:** returns a template with its items, assignees and `inspectionCount`.

### How to build it

`/templates/$id` is the template's home. Use a two-column layout on desktop (`Grid size={{ xs: 12, md: 7 }}` and `md: 5`):

- **Left: the form.** Header with name, project, dates and status chip. Below it, the numbered questions as inspectors will see them. An "Edit" button opens `/templates/$id/edit`.
- **Right: `AssigneesPanel`.** The assignee list and an "Assign inspectors" button (see below).
- **Footer: usage.** "N inspections submitted", linking to `/inspections?templateId=…` (see [07](07-admin-inspections.md)).

```ts
export function useTemplate(id: string): TemplateDetail {
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.get(id),
  });
  return data;
}
```

When `inspectionCount > 0`, show a lock icon next to the questions heading, with the tooltip "Questions are locked because inspections have been submitted."

### Errors

`400` / `404` `Template not found`: route error boundary.

---

## `PATCH /admin/templates/:id`

**What it does:** updates `name`, `validFrom`, `validTo` and/or `items`. `items` **replaces every question and gives each one a new id**, and is allowed only while `inspectionCount === 0`.

### How to build it

`/templates/$id/edit` reuses `TemplateEditor`, prefilled from `useTemplate(id)`, with these differences:

- The **project** is shown read-only.
- **When `inspectionCount > 0`**, `ItemsEditor` is read-only and a banner explains: "These questions are locked because N inspections use them. To change them, create a new template." Add a **"Duplicate as new template"** button that opens `/templates/new` prefilled with the same project, name and questions (see below).
- **Build the body from the diff.** Include `items` only when the question list really changed (compare the arrays of trimmed strings). Sending unchanged items still regenerates every id, which breaks drafts that inspectors built from cached copies (see [02](02-web-templates.md#keeping-it-fresh)). It also fails with `409` once the template has been used.
- Disable Save when nothing changed, which avoids `400 Nothing to update`.

```ts
export function useUpdateTemplate(id: string): UseMutationResult<TemplateDetail, ApiError, UpdateTemplateBody> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (body) => templatesApi.update(id, body),
    onSuccess: (tpl) => {
      queryClient.setQueryData(templatesKeys.detail(id), tpl);
      void queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['projects', 'detail', tpl.project.id] });
      void navigate({ to: '/templates/$id', params: { id } });
    },
  });
}
```

**Confirm risky edits** before sending:

- *Changing questions* on an assigned template (`inspectionCount === 0` but `assignees.length > 0`): "Inspectors who already opened this form will need to refresh it. Any unsent forms based on the old questions will be rejected."
- *Moving `validTo` earlier or `validFrom` later*: "Forms filled outside the new dates will be rejected when they sync." The server checks submits against the dates stored **when the submit arrives**, so this affects forms still sitting in inspectors' outboxes.

### Errors

| Status | UI |
| --- | --- |
| `400` validation / `Nothing to update` | Field errors. |
| `400` `validTo must be on or after validFrom` | Both dates were sent, in the wrong order. Error on Valid to. |
| `400` `Constraint failed: template_dates_chk` | Only one date was sent, and it conflicts with the stored one. Avoid it by **always sending both dates when either changes**, so the server returns the friendlier message above. |
| `404` | Snackbar, then back to `/templates`. |
| `409` `Items cannot change after inspections were submitted; create a new template` | An inspection arrived between loading the page and saving. Nothing was saved, **including the other fields**. Refetch the template, lock the questions, and tell the admin to save again without question changes, or to duplicate the template. |

### Replacing a template that is in use

`API.md` recommends: create a new template, end the old one with `validTo`, and move the assignees. Offer this as one guided action, **"Replace with new version"**:

1. `POST /admin/templates` with the edited questions, `validFrom` = the chosen start date.
2. `POST /admin/templates/{new}/assignments` with the old template's active assignee ids.
3. `PATCH /admin/templates/{old}` with `validTo` = the day before the new `validFrom`.

These are three separate requests, not a transaction. Run them in order, and if one fails, show which steps finished so the admin can complete the rest by hand.

---

## `POST /admin/templates/:id/assignments`

**What it does:** gives inspectors access to the template. Idempotent per user: assigning someone already assigned keeps their original `assignedAt`. Returns the **full** assignee list after the change.

### How to build it

`AssignInspectorsDialog`, opened from `AssigneesPanel`:

- Load candidates with `usersApi.list({ role: 'inspector', isActive: true, limit: 50 })` (see [04](04-admin-users.md)). Page through with infinite scroll if there are more than 50.
- Show a checkbox list or an MUI multi-select `Autocomplete`. Already-assigned inspectors appear checked and disabled.
- Send only newly selected ids, at most 200 per request (split larger selections into chunks).

```ts
export function useAssignInspectors(templateId: string): UseMutationResult<Assignee[], ApiError, string[]> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userIds) => templatesApi.assign(templateId, userIds),
    onSuccess: (assignees, userIds) => {
      // The response is the complete list: write it straight into the detail.
      queryClient.setQueryData<TemplateDetail>(templatesKeys.detail(templateId), (old) =>
        old ? { ...old, assignees } : old,
      );
      for (const userId of userIds) {
        void queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
      }
    },
  });
}
```

### Errors

| Status | UI |
| --- | --- |
| `400` validation | Rare: empty selection, or more than 200. |
| `400` `{ message: "Only active inspectors can be assigned", invalidUserIds }` | **Nobody was assigned.** Read `error.body.invalidUserIds`, mark those people in the dialog ("deactivated or no longer an inspector"), deselect them, and let the admin retry. This happens when someone was deactivated or promoted after the dialog loaded. |
| `404` `Template not found` | Snackbar, close the dialog. |

---

## `DELETE /admin/templates/:id/assignments/:userId`

**What it does:** removes one inspector's access. Their submitted inspections stay. `204 No Content`.

### How to build it

A remove icon on each row of `AssigneesPanel`. Confirm first, because it affects work in the field: "Remove Ahmed from this form? Forms Ahmed has filled but not yet sent will be rejected."

```ts
export function useUnassignInspector(templateId: string): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => templatesApi.unassign(templateId, userId),
    // Optimistic: remove the row immediately, restore it on failure.
    onMutate: async (userId) => {
      const key = templatesKeys.detail(templateId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TemplateDetail>(key);
      queryClient.setQueryData<TemplateDetail>(key, (old) =>
        old ? { ...old, assignees: old.assignees.filter((a) => a.id !== userId) } : old,
      );
      return { previous };
    },
    onError: (_err, _userId, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(templatesKeys.detail(templateId), ctx.previous);
    },
    onSettled: (_data, _err, userId) => {
      void queryClient.invalidateQueries({ queryKey: templatesKeys.detail(templateId) });
      void queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
    },
  });
}
```

### Errors

| Status | UI |
| --- | --- |
| `400` | Bad UUID (a client bug). |
| `404` `Assignment not found` | Someone else already removed it. Treat it as success: refetch quietly, no error snackbar. |

In `AssigneesPanel`, show inactive assignees (`isActive: false`) with a "Deactivated" chip. They keep the assignment but can't sign in.
