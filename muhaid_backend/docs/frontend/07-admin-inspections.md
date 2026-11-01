# Admin dashboard: inspections

Endpoints: `GET /admin/inspections`, `GET /admin/inspections/:id`, `GET /admin/inspections/:id/photo`. Role: `admin`. Contract: [API.md › Inspections](../API.md#admin-inspections).

All three are **read-only**. Submitted inspections are final for admins too, so the UI has no edit or delete actions. This is the review side of the product: find inspections, open one, look at the photo and the answers marked `no`.

```
features/inspections/
  api/inspectionsApi.ts
  hooks/useInspections.ts
  hooks/useInspection.ts
  components/InspectionsFilters.tsx
  components/InspectionsTable.tsx
  components/InspectionView.tsx
  helpers/filtersToParams.ts
  types/index.ts
```

Routes: `/inspections`, `/inspections/$id`.

## Types

`InspectionSummary` and `InspectionDetail` are the shared shapes in `~types/api` (see README).

```ts
import type { PageParams } from '~types/api';

export interface ListInspectionsParams extends PageParams {
  workOrder?: string;   // exact match
  projectId?: string;
  templateId?: string;
  inspectorId?: string;
  from?: string;        // ISO date-time with offset: filledAt >= from
  to?: string;          // ISO date-time with offset: filledAt <= to
}
```

## API layer

```ts
export const inspectionsApi = {
  list: async (params: ListInspectionsParams): Promise<Paginated<InspectionSummary>> =>
    (await apiClient.get<Paginated<InspectionSummary>>('/admin/inspections', { params })).data,

  get: async (id: string): Promise<InspectionDetail> =>
    (await apiClient.get<InspectionDetail>(`/admin/inspections/${id}`)).data,

  /** photoUrl from the detail, already "/admin/inspections/<id>/photo". */
  photo: async (photoUrl: string): Promise<Blob> =>
    (await apiClient.get<Blob>(photoUrl, { responseType: 'blob' })).data,
};

export const inspectionsKeys = {
  all: ['inspections'] as const,
  list: (p: ListInspectionsParams) => ['inspections', 'list', p] as const,
  detail: (id: string) => ['inspections', 'detail', id] as const,
};
```

axios encodes query params with `encodeURIComponent`, so a `+` in an offset becomes `%2B` automatically. The problem described in `API.md` only bites hand-built URLs. Sending `toISOString()` values (ending in `Z`) avoids it entirely.

---

## `GET /admin/inspections`

**What it does:** lists every inspection, newest `filledAt` first. Paginated. Every filter is optional, and filters combine with AND.

### How to build it

`/inspections` page: a filter bar above a table.

#### Filters (`InspectionsFilters`)

| Filter | Control | Sent as |
| --- | --- | --- |
| Project | `ProjectSelect` ([05](05-admin-projects.md)) | `projectId` |
| Template | `Autocomplete` from `GET /admin/templates?projectId=…` ([06](06-admin-templates.md)); narrowed to the chosen project | `templateId` |
| Inspector | `Autocomplete` from `GET /admin/users?role=inspector` ([04](04-admin-users.md)); include inactive inspectors, since their history still matters | `inspectorId` |
| Date range | two date pickers, in the **admin's local** calendar | `from`, `to` |
| Work order | text field, submit on Enter (exact match, so no debounce) | `workOrder` (trimmed; left out when empty) |

**Converting the date range.** The admin picks calendar days, but the API wants exact instants. Convert from local time so "October 1 to October 31" means what the admin expects:

```ts
/** "2026-10-01" → start of that day in the browser's timezone, as UTC ISO. */
const startOfDay = (d: CalendarDate): string => new Date(`${d}T00:00:00`).toISOString();
/** "2026-10-31" → last millisecond of that day, local time, as UTC ISO. */
const endOfDay = (d: CalendarDate): string => new Date(`${d}T23:59:59.999`).toISOString();
```

`new Date('2026-10-01T00:00:00')` (no `Z`) is parsed as **local** time, which is the intent here. `toISOString()` then gives a `Z` value the API accepts.

Keep every filter, plus `page` and `limit`, in the URL search params. The project page links here with `?projectId=…`, the template page with `?templateId=…`, and admins can bookmark or share a filtered view. Changing any filter resets `page` to 1.

#### The table

```ts
export function useInspections(params: ListInspectionsParams): Paginated<InspectionSummary> {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.list(params),
    queryFn: () => inspectionsApi.list(params),
  });
  return data;
}
```

Columns: work order, project code, template, inspector, filled at, received at. Add a "Sync delay" column (`receivedAt - filledAt`), formatted as "on time" under a few minutes and "5 h late" above. It quickly reveals inspectors who work offline for long stretches. A row click opens `/inspections/$id`.

Paginate with `startTransition` (see README), so the table stays visible while the next page loads.

The summary doesn't include answer counts, so a "has findings" column isn't possible without fetching each detail. Don't do that per row. If admins need to filter for inspections with `no` answers, add it to the API.

---

## `GET /admin/inspections/:id`

**What it does:** returns one inspection with every answer. `photoUrl` points to `/admin/inspections/:id/photo`.

### How to build it

`/inspections/$id`, a read-only review page:

```ts
export function useInspection(id: string): InspectionDetail {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.detail(id),
    queryFn: () => inspectionsApi.get(id),
    staleTime: Infinity, // final once submitted; never refetch
  });
  return data;
}
```

Layout:

1. **Header**: work order (large), project and template (linked to their pages), inspector (linked to `/users/$id`), filled at and received at in the admin's timezone.
2. **Summary strip**: counts of yes / no / n/a. The `no` count is the headline: those are the findings.
3. **Photo** in its own `<SuspenseLoader>`, using the shared `AuthedImage` (below).
4. **Answers**, sorted by `position`: number, `label`, answer chip, and note. Give `no` rows a strong accent and show the note prominently. Add a "Show only findings" toggle that filters to `no` answers on the client.

`label` is the question **as it was when submitted**, so it can differ from the template's current wording. Present it as the record of what the inspector actually saw.

**Printing.** Inspection reports are often printed or saved as PDF. Add a print stylesheet (`@media print`: hide navigation, expand the photo) and a "Print" button that calls `window.print()`. That needs no extra endpoint.

### Errors

`400` / `404` `Inspection not found`: route error boundary, "Inspection not found", with a link back to the list.

---

## `GET /admin/inspections/:id/photo`

**What it does:** streams the photo of any inspection. Same headers and errors as the inspector route, and it also needs the `Authorization` header.

### How to build it

Reuse the `AuthedImage` component from [03-web-inspections.md](03-web-inspections.md#get-webinspectionsidphoto), passing the admin API's fetcher:

```tsx
<SuspenseLoader height={320}>
  <ErrorBoundary fallback={<PhotoUnavailable />}>
    <AuthedImage src={inspection.photoUrl} alt={inspection.workOrderNumber} fetchBlob={inspectionsApi.photo} />
  </ErrorBoundary>
</SuspenseLoader>
```

- Open it full screen in a `Dialog` on click, with zoom (`react-zoom-pan-pinch`, lazy-loaded with the dialog).
- A **Download** button can reuse the cached blob: create an `<a download="WO-1042.jpg">` from the object URL. No second request.

### Errors

| Status | UI |
| --- | --- |
| `404` `File not found` | The record exists but the file is missing on the server. Show the "Photo unavailable" placeholder and keep the rest of the page working. |
| `404` `Inspection not found` | Not expected once the detail has loaded. Same placeholder. |
