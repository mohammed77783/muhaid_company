# Inspector app: templates

Endpoints: `GET /web/templates`, `GET /web/templates/:id`. Role: `inspector`. Contract: [API.md › Templates](../API.md#web-templates).

Templates are the forms an inspector fills in. Both endpoints return them **with their items** (the questions), so a cached copy is enough to fill a form offline.

```
features/templates/
  api/templatesApi.ts
  hooks/useMyTemplates.ts
  hooks/useMyTemplate.ts
  components/TemplatePicker.tsx
  helpers/isValidOn.ts
  types/index.ts
```

## Types

```ts
import type { CalendarDate, ProjectRef, TemplateItem } from '~types/api';

export interface WebTemplate {
  id: string;
  name: string;
  validFrom: CalendarDate;
  validTo: CalendarDate | null; // null: no end date
  project: ProjectRef;
  items: TemplateItem[]; // sorted by position
}
```

## API layer

```ts
import { apiClient } from '@/lib/apiClient';
import type { WebTemplate } from '../types';

export const templatesApi = {
  listMine: async (): Promise<WebTemplate[]> =>
    (await apiClient.get<WebTemplate[]>('/web/templates')).data,

  getMine: async (id: string): Promise<WebTemplate> =>
    (await apiClient.get<WebTemplate>(`/web/templates/${id}`)).data,
};

export const templatesKeys = {
  all: ['templates'] as const,
  list: () => ['templates', 'list'] as const,
  detail: (id: string) => ['templates', 'detail', id] as const,
};
```

---

## `GET /web/templates`

**What it does:** returns the templates assigned to me that are **valid today**, each with its items. Not paginated. Sorted by project code, then template name.

### How to build it

This is the inspector's home screen: "Choose a form".

```ts
export function useMyTemplates(): WebTemplate[] {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.list(),
    queryFn: async () => {
      const list = await templatesApi.listMine();
      // Seed the detail cache too, so opening a form never waits on the network.
      for (const t of list) queryClient.setQueryData(templatesKeys.detail(t.id), t);
      return list;
    },
    staleTime: 5 * 60_000,
    gcTime: Infinity, // keep it for offline use
    networkMode: 'offlineFirst',
  });
  return data;
}
```

`TemplatePicker` groups the list by `project.code`, shows each template's name and dates, and navigates to `/inspections/new?templateId=…` when tapped.

**Empty state.** An empty array is a valid answer: nothing is assigned to me, or nothing assigned is valid today. Show "No forms are assigned to you right now. Contact your administrator." Don't treat it as an error.

### Keeping it fresh

Admins can change templates at any time. Before the first inspection on a template, replacing its items **gives every item a new id**, and drafts built from the old ids then fail with `400 missing/unknown`. To reduce that:

- Refetch on app focus and on reconnect (TanStack Query's defaults, which work with `networkMode: 'offlineFirst'`).
- Refetch once when the inspector opens "new inspection" while online, before rendering the form.
- Show "Forms last updated 2 hours ago" with a manual refresh button, using `dataUpdatedAt`.

### Offline

The list goes into the persisted query cache (see [03-web-inspections.md › Offline setup](03-web-inspections.md#offline-setup)). With `networkMode: 'offlineFirst'` and `gcTime: Infinity`, the app shows the last good list while offline instead of suspending forever. If there is no cached copy and no network, the error boundary should say "Connect to the internet once to download your forms."

**Validity offline.** The server picked "valid today" using its own date at fetch time. If the app stays offline across days, a cached template may have expired. Filter on the client with the same rule, so the picker doesn't offer forms that will be rejected:

```ts
/** Same rule as the server: validFrom <= day <= validTo (validTo null = open-ended). */
export function isValidOn(t: Pick<WebTemplate, 'validFrom' | 'validTo'>, day: CalendarDate): boolean {
  return t.validFrom <= day && (t.validTo === null || t.validTo >= day);
}

// "YYYY-MM-DD" strings compare correctly as strings.
const today = new Date().toISOString().slice(0, 10);
```

`toISOString()` gives the **UTC** date. On submit, the server takes the date of `filledAt` in the database's timezone (UTC unless configured otherwise), so using UTC on the client matches it. Near midnight local time, the UTC day can differ from what the inspector sees. Treat the client check as a hint and let the server decide.

---

## `GET /web/templates/:id`

**What it does:** returns one template assigned to me, with its items. **Validity dates are not checked**, so an expired template still loads.

### How to build it

Use it to render the form, and to re-render a saved draft or outbox entry whose template is no longer in the "valid today" list.

```ts
export function useMyTemplate(id: string): WebTemplate {
  const { data } = useSuspenseQuery({
    queryKey: templatesKeys.detail(id),
    queryFn: () => templatesApi.getMine(id),
    gcTime: Infinity,
    networkMode: 'offlineFirst',
  });
  return data;
}
```

Because `useMyTemplates` seeds the detail cache, this usually resolves at once. It only calls the network for a template that dropped out of the list, such as an expired one.

**When the outbox stores a draft**, also store a snapshot of the template's items with it (see [03](03-web-inspections.md#2-save-to-the-outbox-usesaveinspection)). The draft screen then works even if the detail query isn't cached.

### Errors

| Status | UI |
| --- | --- |
| `400` | Bad id in the URL. Show "Form not found" and a link home. |
| `404` `Template not found` | The template doesn't exist **or is no longer assigned to me**. Show "This form is no longer available to you." Remove it from the cached list with `invalidateQueries(templatesKeys.list())`. |
