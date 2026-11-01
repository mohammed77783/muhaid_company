# Inspector app: inspections and offline sync

Endpoints: `POST /web/inspections`, `GET /web/inspections`, `GET /web/inspections/:id`, `GET /web/inspections/:id/photo`. Role: `inspector`. Contract: [API.md › Inspections](../API.md#web-inspections) and [Offline sync flow](../API.md#offline-sync-flow).

This is the most involved feature. Inspectors fill forms on site, often with no signal, so **submitting is never a direct button-to-API call**. Saving a form writes it to a local outbox, and a sync loop sends the outbox to `POST /web/inspections`.

```
features/inspections/
  api/inspectionsApi.ts
  db/outboxDb.ts            # Dexie database: drafts + outbox
  sync/syncOutbox.ts        # the sync loop
  hooks/useMyInspections.ts
  hooks/useMyInspection.ts
  hooks/useOutbox.ts
  hooks/useSaveInspection.ts
  components/InspectionForm/
  components/OutboxList.tsx
  components/MyInspectionsTable.tsx
  components/InspectionView.tsx
  helpers/buildFormData.ts
  helpers/validateDraft.ts
  types/index.ts
```

## Types

```ts
import type { AnswerValue, InspectionDetail, InspectionSummary, PageParams, Paginated, TemplateItem } from '~types/api';

export interface AnswerInput {
  itemId: string;
  answer: AnswerValue;
  note?: string | null; // required when answer === 'no'
}

export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxEntry {
  /** crypto.randomUUID(), created when the form is saved. Never regenerated. */
  id: string;
  /** The inspector who filled it. Only this user's token may send it. */
  inspectorId: string;
  templateId: string;
  templateName: string;
  /** Items at the time of filling, so the entry can be shown without the network. */
  itemsSnapshot: TemplateItem[];
  /** From the template's assignment (`WebTemplate.workOrderNumber`), not typed by the inspector. The server sets it from the assignment. */
  workOrderNumber: string;
  /** new Date().toISOString() at save time. */
  filledAt: string;
  answers: AnswerInput[];
  photo: Blob;
  status: OutboxStatus;
  attempts: number;
  /** Set when the server rejected it with a non-retryable 4xx. */
  lastError?: { status: number; messages: string[]; body: Record<string, unknown> };
}

export interface ListMyInspectionsParams extends PageParams {
  workOrder?: string; // exact match
}

export type { InspectionDetail, InspectionSummary, Paginated };
```

## API layer

```ts
import { apiClient } from '@/lib/apiClient';
import type { InspectionDetail, InspectionSummary, ListMyInspectionsParams, Paginated } from '../types';

export interface SubmitResult {
  /** true for 201 (stored now), false for 200 (already stored: a retry). */
  created: boolean;
  inspection: InspectionDetail;
}

export const inspectionsApi = {
  submit: async (form: FormData): Promise<SubmitResult> => {
    const res = await apiClient.post<InspectionDetail>('/web/inspections', form);
    return { created: res.status === 201, inspection: res.data };
  },

  listMine: async (params: ListMyInspectionsParams): Promise<Paginated<InspectionSummary>> =>
    (await apiClient.get<Paginated<InspectionSummary>>('/web/inspections', { params })).data,

  getMine: async (id: string): Promise<InspectionDetail> =>
    (await apiClient.get<InspectionDetail>(`/web/inspections/${id}`)).data,

  /** photoUrl comes from InspectionDetail and already starts with "/web/inspections". */
  photo: async (photoUrl: string): Promise<Blob> =>
    (await apiClient.get<Blob>(photoUrl, { responseType: 'blob' })).data,
};

export const inspectionsKeys = {
  all: ['inspections'] as const,
  list: (p: ListMyInspectionsParams) => ['inspections', 'list', p] as const,
  detail: (id: string) => ['inspections', 'detail', id] as const,
};
```

---

## Offline setup

Two separate stores, with different jobs:

| Store | Holds | Library |
| --- | --- | --- |
| **Query cache**, persisted | Server data: `/auth/me`, templates, my inspections | `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` over `idb-keyval` |
| **Outbox** | Forms the user saved that the server has not confirmed | Dexie (IndexedDB) |

Keep them apart. The query cache can be cleared, expired or rebuilt at any time, but the outbox is the **only copy** of the inspector's work until the server returns `201` or `200`.

```tsx
// main.tsx
const persister = createAsyncStoragePersister({
  storage: { getItem: get, setItem: set, removeItem: del }, // idb-keyval
});

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    maxAge: 7 * 24 * 60 * 60_000,
    dehydrateOptions: {
      // Photos are large and easy to refetch; don't persist them.
      // AuthedImage uses ['photo', url] keys.
      shouldDehydrateQuery: (q) => q.queryKey[0] !== 'photo' && q.state.status === 'success',
    },
  }}
>
```

```ts
// db/outboxDb.ts
import Dexie, { type Table } from 'dexie';
import type { OutboxEntry } from '../types';

class OutboxDb extends Dexie {
  outbox!: Table<OutboxEntry, string>;
  constructor() {
    super('muhaid-inspector');
    this.version(1).stores({ outbox: 'id, inspectorId, status' });
  }
}
export const outboxDb = new OutboxDb();
```

IndexedDB stores `Blob`s natively, so the photo goes in as is: no base64. Call `navigator.storage.persist()` once after login, so the browser doesn't evict the outbox when storage runs low.

---

## `POST /web/inspections`

**What it does:** stores a filled inspection and its photo. **Idempotent on `id`**: the same `id` sent again returns `200` with the stored copy and ignores the new data.

### How to build it

The flow has three steps.

#### 1. The form (`InspectionForm`)

Route: `/inspections/new?templateId=…`. It reads the template with `useMyTemplate(templateId)` and renders:

- **Work-order number**: text field, trimmed, 1 to 50 characters.
- **One row per item**, in `position` order: the `label`, a three-way toggle (نعم / لا / لا ينطبق, which map to `yes` / `no` / `na`), and a note field. The note is **required as soon as `no` is picked** and optional otherwise (at most 1000 characters).
- **Photo**: `<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment">`. Check `file.size <= 5 * 1024 * 1024` and show a preview. To stay under the limit, downscale large camera photos on the client (draw to a canvas, export with `canvas.toBlob(cb, 'image/jpeg', 0.8)`).
- **Save** button.

Client validation (`validateDraft.ts`) mirrors the server, so most rejections never happen:

```ts
export function validateDraft(d: DraftInput, items: TemplateItem[]): string[] {
  const errors: string[] = [];
  if (!d.photo) errors.push('photo');
  else if (d.photo.size > 5 * 1024 * 1024) errors.push('photo-size');
  const answered = new Map(d.answers.map((a) => [a.itemId, a]));
  for (const item of items) {
    const a = answered.get(item.id);
    if (!a) errors.push(`item:${item.id}`);
    else if (a.answer === 'no' && !a.note?.trim()) errors.push(`note:${item.id}`);
  }
  return errors;
}
```

**Every item must be answered exactly once.** Build `answers` from `items`, not from whatever the user touched, so there are no extras and no duplicates.

#### 2. Save to the outbox (`useSaveInspection`)

Saving is local and instant. This is when the `id` and `filledAt` are fixed.

```ts
export function useSaveInspection(): (draft: DraftInput, template: WebTemplate) => Promise<string> {
  const user = useCurrentUser();
  return useCallback(async (draft, template) => {
    const entry: OutboxEntry = {
      id: crypto.randomUUID(),            // the idempotency key, generated ONCE
      inspectorId: user.id,
      templateId: template.id,
      templateName: template.name,
      itemsSnapshot: template.items,
      workOrderNumber: template.workOrderNumber, // shown read-only, never sent
      filledAt: new Date().toISOString(), // device time, ends in Z
      answers: template.items.map((item) => {
        const a = draft.answersByItem[item.id];
        return { itemId: item.id, answer: a.answer, note: a.note?.trim() || null };
      }),
      photo: draft.photo,
      status: 'pending',
      attempts: 0,
    };
    await outboxDb.outbox.add(entry);
    void syncOutbox(user.id); // try right away; fine if offline
    return entry.id;
  }, [user.id]);
}
```

Afterwards, navigate to the outbox screen and show "Saved. It will be sent when you're online." with `useMuiSnackbar`.

Never generate a new `id` on retry, and never generate it when the form opens (an abandoned form would then waste an id). Generate it **when the user saves**.

#### 3. Sync (`syncOutbox`)

```ts
import { toApiError } from '@/lib/apiError';

let running = false;

export async function syncOutbox(inspectorId: string): Promise<void> {
  if (running || !navigator.onLine) return;
  running = true;
  try {
    const entries = await outboxDb.outbox
      .where({ inspectorId })
      .filter((e) => e.status !== 'failed')
      .toArray();

    for (const entry of entries) {
      await outboxDb.outbox.update(entry.id, { status: 'syncing' });
      try {
        const { inspection } = await inspectionsApi.submit(buildFormData(entry));
        // 201 or 200: the server has it. Only now is it safe to delete.
        await outboxDb.outbox.delete(entry.id);
        queryClient.setQueryData(inspectionsKeys.detail(inspection.id), inspection);
      } catch (err) {
        const e = toApiError(err);
        if (e.isRetryable) {
          await outboxDb.outbox.update(entry.id, { status: 'pending', attempts: entry.attempts + 1 });
          break; // offline or server down: stop and wait for the next trigger
        }
        if (e.status === 401) {
          await outboxDb.outbox.update(entry.id, { status: 'pending' });
          break; // the interceptor sends the user to login; retry after login
        }
        await outboxDb.outbox.update(entry.id, {
          status: 'failed',
          lastError: { status: e.status, messages: e.messages, body: e.body },
        });
      }
    }
  } finally {
    running = false;
    void queryClient.invalidateQueries({ queryKey: inspectionsKeys.all });
  }
}

export function buildFormData(e: OutboxEntry): FormData {
  const form = new FormData();
  form.append('id', e.id);
  form.append('templateId', e.templateId);
  form.append('filledAt', e.filledAt);
  form.append('answers', JSON.stringify(e.answers)); // a JSON *string*
  form.append('photo', e.photo, `photo.${e.photo.type.split('/')[1] ?? 'jpg'}`);
  return form;
}
```

Run `syncOutbox(user.id)` on:

- app start, after `/auth/me` resolves,
- `window` `online` events,
- every successful login,
- a "Send now" button on the outbox screen,
- optionally a 60-second interval while the outbox isn't empty.

Sending entries one at a time keeps a large batch from saturating a weak connection, and stopping at the first network error avoids burning through retries.

Sync while the app is closed (Background Sync API) isn't needed for v1: the sync triggers above cover the normal case.

### Status codes → outbox action

This matches the table in `API.md`:

| Response | Meaning | Outbox action | UI |
| --- | --- | --- | --- |
| `201` | Stored | delete entry | Moves to "Sent" |
| `200` | Already stored (an earlier attempt succeeded but the reply was lost) | delete entry | Same as 201 |
| network / `5xx` | Not stored | keep `pending`, retry later | "Waiting for connection" |
| `401` | Token expired or account deactivated | keep `pending` | Login screen; sync resumes after login |
| `400` validation | Data is wrong | `failed` | Show messages; let the user **edit and resave** |
| `400` `{ missing, unknown }` | The template's items changed after the form was filled | `failed` | "This form changed. Refill it with the latest version." Offer to open a new form prefilled with the work order and photo |
| `400` `photo is required` / `must be a JPEG, PNG or WebP` | Bad or missing photo | `failed` | Ask for a new photo |
| `403` `This template is not assigned to you` | Unassigned before sync | `failed` | "You no longer have access to this form. Contact your administrator." |
| `409` `An inspection with this id already exists` | The `id` was used by another inspector (practically impossible with `randomUUID`) | `failed` | Offer "Resubmit as new", which copies the entry with a **new** id |
| `413` `File too large` | Photo over 5 MB | `failed` | Ask for a smaller photo (or recompress it automatically) |
| `422` `The template was not valid on the date the form was filled` | `filledAt` is outside the template's dates | `failed` | Show the message. Retrying won't help |

**Editing a failed entry.** When the user fixes the data, keep the same `id`. The server stored nothing for it, so the same `id` is still free. The exception is `409`, which needs a new `id`.

### The outbox screen (`OutboxList`)

`useOutbox()` reads the entries live with Dexie's `useLiveQuery(() => outboxDb.outbox.where({ inspectorId }).toArray())`. It's local data, so no Suspense or TanStack Query is needed. Each row shows the template name, work order, `filledAt` and status (pending / sending / failed with the error). Show a badge with the pending count in the app bar, so the inspector always knows something hasn't been sent.

---

## `GET /web/inspections`

**What it does:** lists inspections **I** submitted. Paginated, newest `filledAt` first. Optional `workOrder` filter (exact match).

### How to build it

The "Sent" tab, next to the outbox.

```ts
export function useMyInspections(params: ListMyInspectionsParams): Paginated<InspectionSummary> {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.list(params),
    queryFn: () => inspectionsApi.listMine(params),
    networkMode: 'offlineFirst',
  });
  return data;
}
```

- A list of cards on mobile, a table on wider screens: work order, template, project, `filledAt`. Also show the delay between `receivedAt` and `filledAt` ("synced 3 h later"), which tells the inspector that offline sync worked.
- Page through with `startTransition` (see README › Pagination with Suspense). On mobile, `useSuspenseInfiniteQuery` with a "Load more" button suits better: `getNextPageParam: (last) => last.page * last.limit < last.total ? last.page + 1 : undefined`.
- **Work-order search** is an exact match, so don't debounce it as you type. Use a search field that submits on Enter, trims the value, and sends `workOrder` only when it isn't empty (an empty string fails the 1-character minimum).
- Store `page` and `workOrder` in the URL search params.

Show "Sent" and "Outbox" as two clearly separate tabs. An entry in the outbox is **not** in this list until it syncs.

---

## `GET /web/inspections/:id`

**What it does:** returns one of my inspections with every answer. Someone else's inspection returns `404`.

### How to build it

Route `/inspections/$id`, reached from the list or after a sync.

```ts
export function useMyInspection(id: string): InspectionDetail {
  const { data } = useSuspenseQuery({
    queryKey: inspectionsKeys.detail(id),
    queryFn: () => inspectionsApi.getMine(id),
    staleTime: Infinity, // inspections never change once submitted
  });
  return data;
}
```

`staleTime: Infinity` is correct here: inspections are final, and no route or database trigger lets them change. Fetch once and cache forever.

`InspectionView` shows a header (work order, template, project, filled and received times), the photo (see below) and the answers sorted by `position`. Each answer shows its `label` (the question **as it was at submission time**), a coloured chip for yes / no / n/a, and the note when there is one. Highlight `no` answers, because those are the findings.

### Errors

`404` `Inspection not found` covers both "doesn't exist" and "not mine". Show "Inspection not found" in the route's error boundary, with a link back to the list.

---

## `GET /web/inspections/:id/photo`

**What it does:** streams the photo bytes. **It needs the `Authorization` header**, so `<img src>` won't work.

### How to build it

Build one shared `AuthedImage` component in `src/components/AuthedImage/`. The admin dashboard uses the same pattern (see [07](07-admin-inspections.md)).

```tsx
interface AuthedImageProps {
  /** photoUrl from InspectionDetail, e.g. "/web/inspections/<id>/photo". */
  src: string;
  alt: string;
  fetchBlob: (src: string) => Promise<Blob>;
}

export const AuthedImage: React.FC<AuthedImageProps> = ({ src, alt, fetchBlob }) => {
  const { data: blob } = useSuspenseQuery({
    queryKey: ['photo', src],
    queryFn: () => fetchBlob(src),
    staleTime: Infinity, // the photo never changes
  });
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]); // avoid leaking the blob

  return <Box component="img" src={url} alt={alt} sx={{ maxWidth: '100%', borderRadius: 1 }} />;
};

export default AuthedImage;
```

Use it like this:

```tsx
<SuspenseLoader height={240}>
  <AuthedImage src={inspection.photoUrl} alt={inspection.workOrderNumber} fetchBlob={inspectionsApi.photo} />
</SuspenseLoader>
```

Give the photo its **own** Suspense boundary, so the answers render while the image is still downloading. Open the image full screen in a `Dialog` when tapped.

### Errors

| Status | UI |
| --- | --- |
| `404` `Inspection not found` | Rare here, because the detail already loaded. Show a placeholder. |
| `404` `File not found` | The record exists but the file is missing on the server. Show a "Photo unavailable" placeholder, not a page-level error. Use a small error boundary around `AuthedImage`. |

For an entry that is still in the outbox, show the local `Blob` with `URL.createObjectURL(entry.photo)`. No request is needed.
