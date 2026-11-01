# Muhaid Inspections API

REST API behind two clients:

- **Inspector app** (React, works offline): fills inspection forms on site and syncs them. Uses the `/web/*` routes.
- **Admin dashboard**: manages users, projects, templates and assignments, and reviews submitted inspections. Uses the `/admin/*` routes.

Both clients sign in through the shared `/auth/*` routes.

## Contents

- [Conventions](#conventions)
  - [Base URL, CORS and environment](#base-url-cors-and-environment)
  - [Authentication](#authentication)
  - [Request bodies and validation](#request-bodies-and-validation)
  - [Dates and times](#dates-and-times)
  - [Pagination](#pagination)
  - [Errors](#errors)
- [Domain model](#domain-model)
- [Endpoint index](#endpoint-index)
- [Auth](#auth)
- [Inspector app (`/web`)](#inspector-app-web)
  - [Templates](#web-templates)
  - [Inspections](#web-inspections)
  - [Offline sync flow](#offline-sync-flow)
- [Admin dashboard (`/admin`)](#admin-dashboard-admin)
  - [Users](#admin-users)
  - [Projects](#admin-projects)
  - [Templates and assignments](#admin-templates-and-assignments)
  - [Inspections](#admin-inspections)
- [Health check](#health-check)
- [Shared response shapes](#shared-response-shapes)

---

## Conventions

### Base URL, CORS and environment

There is no global path prefix. Locally the API runs at `http://localhost:3000` (set `PORT` to change it). Every path below is relative to that base.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. The app refuses to start without it. |
| `JWT_SECRET` | yes | Signing key for access tokens, at least 32 characters. |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `8h` (any `jsonwebtoken` duration such as `30m` or `1d`). |
| `UPLOAD_DIR` | no | Folder for inspection photos, default `uploads` (relative to the working directory). |
| `CORS_ORIGIN` | no | Comma-separated list of allowed browser origins. When unset, every origin is allowed. |
| `PORT` | no | HTTP port, default `3000`. |

Values load from `.env.production` when `NODE_ENV=production`, otherwise from `.env.development`.

The first admin account is created with `npm run db:seed`, which reads `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Re-running the seed leaves an existing account alone.

### Authentication

Every route requires a token except `POST /auth/login` and `GET /`. Send the token from login on each request:

```http
Authorization: Bearer <accessToken>
```

How the token is checked:

1. The header must be exactly `Bearer <token>`. A missing or malformed header returns `401`.
2. The token signature and expiry are verified. An invalid or expired token returns `401`. There is no refresh endpoint: when the token expires, the user logs in again.
3. The user is reloaded from the database on **every request**. A deactivated or deleted user gets `401` straight away, even while their token is still valid. Role changes also apply immediately, because the role is read from the database, not from the token.
4. The route's required role is checked. The wrong role returns `403`.

| Route group | Allowed role |
| --- | --- |
| `/auth/*` | any signed-in user |
| `/web/*` | `inspector` only. Admins get `403`. |
| `/admin/*` | `admin` only. Inspectors get `403`. |

The two roles are `admin` and `inspector`.

### Request bodies and validation

- JSON bodies need `Content-Type: application/json`. The one exception is `POST /web/inspections`, which takes `multipart/form-data`.
- **Unknown fields are silently removed**, not rejected. For example, sending `email` to `PATCH /admin/users/:id` has no effect, because email cannot be changed.
- String fields marked *trimmed* have surrounding whitespace removed before validation. A value that becomes empty after trimming fails its length check.
- Emails are trimmed and lower-cased, so login and uniqueness checks ignore letter case.
- `PATCH` endpoints need at least one recognised field. An empty body, or one that contains only unknown fields, returns `400` with `"Nothing to update"`.
- `:id` path parameters must be UUIDs. Anything else returns `400` with `"Validation failed (uuid is expected)"`.

### Dates and times

There are two formats, and they are not interchangeable:

| Kind | Format | Used by |
| --- | --- | --- |
| **Calendar date** | `YYYY-MM-DD`, e.g. `2026-10-31` | `validFrom` and `validTo` on templates, in requests and responses. |
| **Date-time** | ISO 8601 **with a timezone offset**, e.g. `2026-10-31T09:15:00Z` or `2026-10-31T12:15:00+03:00` | `filledAt` on submit and the `from`/`to` inspection filters. A value without `Z` or an offset is rejected. |

Every timestamp in a response (`createdAt`, `filledAt`, `receivedAt`, `assignedAt`) is returned as an ISO 8601 string in UTC, e.g. `"2026-10-31T09:15:00.000Z"`.

### Pagination

List endpoints marked *paginated* accept these query parameters:

| Param | Type | Default | Rules |
| --- | --- | --- | --- |
| `page` | integer | `1` | at least 1 |
| `limit` | integer | `20` | 1 to 50 |

They return this envelope:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

`total` is the number of rows that match the filters across all pages. The number of pages is `Math.ceil(total / limit)`.

### Errors

Most errors use NestJS's standard body:

```json
{
  "statusCode": 404,
  "message": "Template not found",
  "error": "Not Found"
}
```

**Validation errors** (`400`) list every failed rule in `message` and also include an empty `data` array:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request",
  "data": []
}
```

Nested fields are prefixed with their path, e.g. `"answers.2.note is required when the answer is \"no\""`.

A few errors return extra fields **instead of** the standard body. These have no `statusCode` or `error` key, so read the HTTP status:

```json
{ "message": "Only active inspectors can be assigned", "invalidUserIds": ["…"] }
```

```json
{ "message": "Every template item must be answered exactly once", "missing": ["…"], "unknown": ["…"] }
```

`401` and `403` responses from the auth checks have only `message` and `statusCode`:

```json
{ "message": "Unauthorized", "statusCode": 401 }
```

Database constraint errors are turned into client errors:

| Cause | Status | Message |
| --- | --- | --- |
| Duplicate user email (any letter case) | `409` | `A user with this email already exists` |
| Duplicate project code | `409` | `A project with this code already exists` |
| Any other duplicate value | `409` | `Duplicate value` |
| A referenced row does not exist | `400` | `Referenced record does not exist` |
| A CHECK constraint failed | `400` | `Constraint failed: <constraint_name>` |
| Something tried to change a submitted inspection | `409` | `Submitted inspections cannot be changed` |

Any other unexpected error returns `500` with `{ "statusCode": 500, "message": "Internal server error" }`.

---

## Domain model

```
Project ──< Template ──< Template item (the questions, ordered by position)
               │
               ├──< Assignment >── User (inspector)
               │
               └──< Inspection ──< Answer (one per template item)
                        │
                        └── Photo (one file per inspection)
```

- **User**: an `admin` or an `inspector`. Users are never deleted, only deactivated (`isActive: false`), because their inspections reference them.
- **Project**: has a unique `code` (letters, digits, `-`, `_`, e.g. `PRJ-2026-001`) and a free-text `name` (often Arabic).
- **Template** (نموذج التفتيش): an inspection form that belongs to one project. It is valid from `validFrom` to `validTo` inclusive. A `null` `validTo` means it has no end date.
- **Template item** (بند): one question on a template, with a `position` that starts at 1. Answers are `yes`, `no` or `na` (نعم / لا / لا ينطبق).
- **Assignment**: lets one inspector fill one template. Only active inspectors can be assigned. Creating one also creates its **work order** (أمر العمل): a generated, unique `workOrderNumber` such as `WO-000123`, which never changes. Re-assigning an existing pair keeps the same number. A work order is a **one-time job**: the first submission completes it (`completedAt`), after which it no longer appears in `GET /web/templates` and a new submission under it gets `409`.
- **Inspection**: a filled-in form. Its `id` is generated **on the device** and acts as the idempotency key for offline sync. It records the work-order number of the assignment it was filled under, one photo, the device time (`filledAt`) and the server time (`receivedAt`). **Inspections are final once submitted.** No route updates or deletes them, and a database trigger blocks any `UPDATE` on them.
- **Answer**: one per template item. A **note is required when the answer is `no`**. The question text is copied into the answer when the inspection is submitted, so later wording changes never alter old inspections.

---

## Endpoint index

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | public | Health check |
| `POST` | `/auth/login` | public | Log in and get an access token |
| `GET` | `/auth/me` | any | Current user |
| `GET` | `/web/templates` | inspector | My templates that are valid today, with items |
| `GET` | `/web/templates/:id` | inspector | One of my templates, with items |
| `POST` | `/web/inspections` | inspector | Submit a filled inspection (multipart, idempotent) |
| `GET` | `/web/inspections` | inspector | My inspections (paginated) |
| `GET` | `/web/inspections/:id` | inspector | One of my inspections, with answers |
| `GET` | `/web/inspections/:id/photo` | inspector | Photo of one of my inspections |
| `POST` | `/admin/users` | admin | Create a user |
| `GET` | `/admin/users` | admin | List users (paginated) |
| `GET` | `/admin/users/:id` | admin | One user, with assigned templates |
| `PATCH` | `/admin/users/:id` | admin | Update name, role, active flag or password |
| `POST` | `/admin/projects` | admin | Create a project |
| `GET` | `/admin/projects` | admin | List projects (paginated) |
| `GET` | `/admin/projects/:id` | admin | One project, with its templates |
| `PATCH` | `/admin/projects/:id` | admin | Update code or name |
| `POST` | `/admin/templates` | admin | Create a template with its items |
| `GET` | `/admin/templates` | admin | List templates (paginated) |
| `GET` | `/admin/templates/:id` | admin | One template, with items, assignees and inspection count |
| `PATCH` | `/admin/templates/:id` | admin | Update a template (items only before first use) |
| `POST` | `/admin/templates/:id/assignments` | admin | Assign inspectors to a template |
| `DELETE` | `/admin/templates/:id/assignments/:userId` | admin | Remove an inspector from a template |
| `GET` | `/admin/inspections` | admin | List all inspections (paginated, filterable) |
| `GET` | `/admin/inspections/:id` | admin | One inspection, with answers |
| `GET` | `/admin/inspections/:id/photo` | admin | Photo of an inspection |

The API has no delete routes for users, projects, templates or inspections.

---

## Auth

### `POST /auth/login`

Exchanges an email and password for an access token. Public.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email. Trimmed and lower-cased. |
| `password` | string | 1 to 200 characters. |

```json
{ "email": "admin@example.com", "password": "s3cret-pass" }
```

**`200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "id": "0b6c1c8e-6a51-4f43-9b39-2a3b1f0e9d11",
    "name": "Site Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

The token's payload holds `sub` (the user id) and `role`. It expires after `JWT_EXPIRES_IN` (default 8 hours).

**Errors**

| Status | When |
| --- | --- |
| `400` | Body validation failed. |
| `401` `Invalid email or password` | Unknown email, wrong password, **or a deactivated account**. All three get the same message and take about the same time, so the response does not reveal which emails exist. |

---

### `GET /auth/me`

Returns the signed-in user, freshly loaded from the database. Any role. Clients can call it on startup to check that a stored token still works.

**`200 OK`**

```json
{
  "id": "0b6c1c8e-6a51-4f43-9b39-2a3b1f0e9d11",
  "name": "Site Admin",
  "email": "admin@example.com",
  "role": "admin"
}
```

**Errors:** `401` when the token is missing, invalid or expired, or the user is deactivated.

---

## Inspector app (`/web`)

Every route here requires role **`inspector`**. An inspector can only see templates assigned to them and inspections they submitted.

<a id="web-templates"></a>
### Templates

#### `GET /web/templates`

Lists the templates assigned to me that are **valid today** and **not yet submitted** (`validFrom <= today` and `validTo` is null or `>= today`, using the database's current date), each with its items. The app should cache this response so forms can be filled offline.

Not paginated. Sorted by project code, then template name.

**`200 OK`**

```json
[
  {
    "id": "6f1e2d9a-3c4b-4a5e-8f70-1a2b3c4d5e6f",
    "name": "فحص السلامة اليومي",
    "validFrom": "2026-10-01",
    "validTo": null,
    "project": {
      "id": "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
      "code": "PRJ-2026-001",
      "name": "مشروع الطريق الدائري"
    },
    "workOrderNumber": "WO-000123",
    "items": [
      { "id": "11111111-1111-4111-8111-111111111111", "position": 1, "label": "هل يرتدي العمال معدات الحماية؟" },
      { "id": "22222222-2222-4222-8222-222222222222", "position": 2, "label": "هل منطقة العمل مسيجة؟" }
    ]
  }
]
```

An empty array means nothing is assigned to me or nothing assigned is valid today.

#### `GET /web/templates/:id`

Returns one template assigned to me, with its work order number and items, in the same shape as a list entry. **The validity dates are not checked here**, so the app can still load a template that expired after a form was filled offline.

**Errors**

| Status | When |
| --- | --- |
| `400` | `id` is not a UUID. |
| `404` `Template not found` | The template does not exist **or is not assigned to me**. |

<a id="web-inspections"></a>
### Inspections

#### `POST /web/inspections`

Submits a filled inspection with its photo. The request is **idempotent on `id`**, so the app can safely resend it after losing connection.

**Content-Type:** `multipart/form-data`. Every form field is sent as text.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Generated on the device with `crypto.randomUUID()` **when the form is saved**, and reused on every retry. |
| `templateId` | UUID | Must be a template assigned to me. |
| `filledAt` | date-time | When the form was filled, in device time. Needs a timezone offset (see [Dates and times](#dates-and-times)). At most 5 minutes in the future, to allow for clock skew. |
| `answers` | JSON text | A JSON **string** holding an array of 1 to 50 answers (shape below). Each `itemId` may appear only once. |
| `photo` | file | Required on the first submit. JPEG, PNG or WebP, at most **5 MB**. The type is detected from the file's bytes; the filename and the client's MIME type are ignored. |

Each entry in `answers`:

| Field | Type | Rules |
| --- | --- | --- |
| `itemId` | UUID | An item of `templateId`. |
| `answer` | `"yes"` \| `"no"` \| `"na"` | |
| `note` | string \| null | Optional, at most 1000 characters. Trimmed, and an empty or missing note is stored as `null`. **Required when `answer` is `"no"`.** |

**Every item on the template must be answered exactly once.** Missing items, extra items and duplicates are all rejected.

Example with `fetch`:

```js
const form = new FormData();
form.append('id', draft.id); // crypto.randomUUID(), saved with the draft
form.append('templateId', draft.templateId);
form.append('filledAt', draft.filledAt); // e.g. new Date().toISOString()
form.append(
  'answers',
  JSON.stringify([
    { itemId: '1111…', answer: 'yes' },
    { itemId: '2222…', answer: 'no', note: 'السياج مكسور من الجهة الشمالية' },
  ]),
);
form.append('photo', photoBlob, 'photo.jpg');

await fetch(`${API}/web/inspections`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }, // let the browser set Content-Type
  body: form,
});
```

The same request with `curl`:

```bash
curl -X POST http://localhost:3000/web/inspections \
  -H "Authorization: Bearer $TOKEN" \
  -F id=3f2504e0-4f89-41d3-9a0c-0305e82c3301 \
  -F templateId=6f1e2d9a-3c4b-4a5e-8f70-1a2b3c4d5e6f \
  -F filledAt=2026-10-31T09:15:00+03:00 \
  -F 'answers=[{"itemId":"11111111-1111-4111-8111-111111111111","answer":"yes"},{"itemId":"22222222-2222-4222-8222-222222222222","answer":"no","note":"broken fence"}]' \
  -F photo=@site.jpg
```

**Success**

| Status | Meaning |
| --- | --- |
| `201 Created` | The inspection was stored. |
| `200 OK` | An inspection with this `id` was **already** stored by me, so this request was a retry. The body is the **stored** inspection, and the data in this request is ignored. |

Both return the [inspection detail](#inspection-detail) with `photoUrl` set to `/web/inspections/:id/photo`.

**How the server processes it, in order**

1. The upload is read: at most one file, and it must be in the field named `photo`.
2. Form fields are validated (`400` on failure).
3. If the `id` already exists and belongs to me, the stored inspection is returned with `200`. If it belongs to someone else, the server returns `409`.
4. The photo must be present and be a JPEG, PNG or WebP image.
5. The template must be assigned to me (`403`) and **valid on the date of `filledAt`**, not on today's date (`422`). A form filled offline while the template was valid still syncs after the template ends.
6. The answers must cover every template item exactly once.
7. The inspection, its answers and the photo are saved together. If saving the photo fails, nothing is stored.

**Errors**

| Status | Message / body | When |
| --- | --- | --- |
| `400` | validation messages | A field is missing or invalid, `answers` is not a valid JSON array, a `no` answer has no note, `filledAt` is more than 5 minutes ahead, or an item appears twice. |
| `400` | `photo is required` | No file in a first-time submit. |
| `400` | `photo must be a JPEG, PNG or WebP image` | The file's bytes are not one of those formats. |
| `400` | `{ message, missing, unknown }` | The answers do not match the template's items. `missing` lists item ids with no answer, and `unknown` lists answered ids that are not on the template. |
| `400` | `Unexpected field` | The file was sent under a field name other than `photo`, or more than one file was sent. |
| `403` | `This template is not assigned to you` | The template is not assigned to me, or it does not exist. |
| `409` | `An inspection with this id already exists` | Another inspector already used this `id`. |
| `409` | `This work order was already submitted for this template` | The assignment is already completed. Not retryable: discard the entry. |
| `413` | `File too large` | The photo is over 5 MB. |
| `422` | `The template was not valid on the date the form was filled` | `filledAt` falls outside `validFrom`–`validTo`. |

Photos are stored at `<UPLOAD_DIR>/<projectCode>_<inspectorId>/<inspectionId>.<jpg|png|webp>`.

#### `GET /web/inspections`

Lists inspections **I** submitted. Paginated. Sorted by `filledAt`, newest first.

**Query**

| Param | Type | Rules |
| --- | --- | --- |
| `page`, `limit` | integer | See [Pagination](#pagination). |
| `workOrder` | string | Optional. **Exact** match on the work-order number, 1 to 50 characters, trimmed. |

Any other query parameter is ignored. In particular, an inspector cannot widen the list to other inspectors.

**`200 OK`**: a [paginated](#pagination) list of [inspection summaries](#inspection-summary).

#### `GET /web/inspections/:id`

Returns one of my inspections with all its answers.

**`200 OK`**: an [inspection detail](#inspection-detail) with `photoUrl` set to `/web/inspections/:id/photo`.

**Errors**

| Status | When |
| --- | --- |
| `400` | `id` is not a UUID. |
| `404` `Inspection not found` | It does not exist **or another inspector submitted it**. The server returns `404` rather than `403` so that ids belonging to others are not confirmed. |

#### `GET /web/inspections/:id/photo`

Streams the photo of one of my inspections.

**`200 OK`**: the image bytes, with `Content-Type` set to `image/jpeg`, `image/png` or `image/webp`, plus `Content-Length` and `Content-Disposition: inline`.

> **Note:** this route needs the `Authorization` header, so `<img src="/web/inspections/…/photo">` does not work. Fetch the image with the token and display it through an object URL:
>
> ```js
> const res = await fetch(API + inspection.photoUrl, {
>   headers: { Authorization: `Bearer ${token}` },
> });
> img.src = URL.createObjectURL(await res.blob());
> ```

**Errors**

| Status | When |
| --- | --- |
| `404` `Inspection not found` | It does not exist or is not mine. |
| `404` `File not found` | The inspection exists but its file is missing from storage. |

### Offline sync flow

This is the client flow the API is designed for:

1. **Online:** call `GET /web/templates` and cache the result, which includes the items.
2. **Filling a form:** when the inspector saves, generate `id = crypto.randomUUID()` and record `filledAt = new Date().toISOString()`. Store both with the answers and the photo in a local outbox.
3. **Syncing:** for each item in the outbox, call `POST /web/inspections` with the **same `id`** every time.
   - `201` or `200`: synced. Remove it from the outbox.
   - Network error or `5xx`: keep it and retry later. Retries are safe.
   - `401`: the token expired or the account was deactivated. Log in again, then retry.
   - Any other `4xx` (`400`, `403`, `409`, `413`, `422`): retrying will not help. Show the error to the inspector.
4. Because validity is checked against `filledAt`, a form filled on the last valid day still syncs afterwards. If the admin unassigns the inspector before sync, the first submit returns `403`.

Item ids are fixed once a template has been used: an admin cannot replace the items of a template that already has inspections. Before the first inspection, though, replacing the items **gives every item a new id**, so drafts built from an older cached copy return `400` with `missing`/`unknown`. Refreshing `GET /web/templates` before filling a form avoids this.

---

## Admin dashboard (`/admin`)

Every route here requires role **`admin`**.

<a id="admin-users"></a>
### Users

User objects never include the password hash.

#### `POST /admin/users`

Creates a user.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1 to 200 characters, trimmed. |
| `email` | string | Valid email, trimmed and lower-cased. Must be unique regardless of letter case. |
| `password` | string | 8 to 200 characters. |
| `role` | `"admin"` \| `"inspector"` | Optional, default `"inspector"`. |

```json
{
  "name": "أحمد علي",
  "email": "ahmed@example.com",
  "password": "change-me-123",
  "role": "inspector"
}
```

**`201 Created`**

```json
{
  "id": "c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f",
  "name": "أحمد علي",
  "email": "ahmed@example.com",
  "role": "inspector",
  "isActive": true,
  "createdAt": "2026-10-31T09:00:00.000Z"
}
```

**Errors:** `400` validation, `409` `A user with this email already exists`.

#### `GET /admin/users`

Lists users. Paginated. Newest first.

**Query**

| Param | Type | Rules |
| --- | --- | --- |
| `page`, `limit` | integer | See [Pagination](#pagination). |
| `role` | `admin` \| `inspector` | Optional filter. |
| `isActive` | `true` \| `false` | Optional filter. Only the exact strings `true` and `false` are accepted. |

Example: `GET /admin/users?role=inspector&isActive=true&page=1&limit=50`

**`200 OK`**: a [paginated](#pagination) list of user objects (the shape returned by `POST`).

#### `GET /admin/users/:id`

Returns one user and the templates assigned to them.

**`200 OK`**

```json
{
  "id": "c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f",
  "name": "أحمد علي",
  "email": "ahmed@example.com",
  "role": "inspector",
  "isActive": true,
  "createdAt": "2026-10-31T09:00:00.000Z",
  "templates": [
    {
      "id": "6f1e2d9a-3c4b-4a5e-8f70-1a2b3c4d5e6f",
      "name": "فحص السلامة اليومي",
      "validFrom": "2026-10-01",
      "validTo": null,
      "project": { "id": "9a8b…", "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" },
      "assignedAt": "2026-10-15T07:30:00.000Z"
    }
  ]
}
```

`templates` is sorted by project code, then template name, and includes templates that have expired.

**Errors:** `400` bad UUID, `404` `User not found`.

#### `PATCH /admin/users/:id`

Updates a user. Send only the fields you want to change. At least one is required.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1 to 200 characters, trimmed. |
| `role` | `"admin"` \| `"inspector"` | |
| `isActive` | boolean | `false` deactivates the user. Their tokens stop working on the next request. |
| `password` | string | 8 to 200 characters. Sets a new password (admin reset). |

The email cannot be changed.

```json
{ "isActive": false }
```

**`200 OK`**: the updated user object (no `templates`).

**Errors**

| Status | When |
| --- | --- |
| `400` | Validation failed, or `Nothing to update`. |
| `400` `You cannot deactivate yourself or remove your own admin role` | An admin tried to set `isActive: false` or `role: "inspector"` on their own account. |
| `404` `User not found` | |

Notes:
- Changing an inspector to `admin` keeps their existing assignments, but they can no longer use `/web/*`.
- Deactivated inspectors cannot be assigned to templates. Existing assignments stay in place.

<a id="admin-projects"></a>
### Projects

#### `POST /admin/projects`

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `code` | string | 1 to 50 characters, trimmed, only `A–Z a–z 0–9 - _`. Unique. |
| `name` | string | 1 to 200 characters, trimmed. |

```json
{ "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" }
```

**`201 Created`**

```json
{
  "id": "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
  "code": "PRJ-2026-001",
  "name": "مشروع الطريق الدائري",
  "createdAt": "2026-10-31T09:00:00.000Z"
}
```

**Errors:** `400` validation (bad characters return `Use letters, digits, "-" or "_" only`), `409` `A project with this code already exists`.

#### `GET /admin/projects`

Lists projects. Paginated. Newest first. Only `page` and `limit` are accepted.

**`200 OK`**: a [paginated](#pagination) list of project objects.

#### `GET /admin/projects/:id`

Returns one project and all its templates, sorted by name.

**`200 OK`**

```json
{
  "id": "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
  "code": "PRJ-2026-001",
  "name": "مشروع الطريق الدائري",
  "createdAt": "2026-10-31T09:00:00.000Z",
  "templates": [
    { "id": "6f1e…", "name": "فحص السلامة اليومي", "validFrom": "2026-10-01", "validTo": null }
  ]
}
```

**Errors:** `400` bad UUID, `404` `Project not found`.

#### `PATCH /admin/projects/:id`

Updates `code` and/or `name`, with the same rules as create. At least one field is required.

**`200 OK`**: the updated project (no `templates`).

**Errors:** `400` validation or `Nothing to update`, `404` `Project not found`, `409` duplicate code.

Changing the code does not move photos already uploaded. Their stored paths keep the old code, and new uploads go into a folder named after the new code.

<a id="admin-templates-and-assignments"></a>
### Templates and assignments

#### `POST /admin/templates`

Creates a template and its items in a single step.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `projectId` | UUID | An existing project. |
| `name` | string | 1 to 200 characters, trimmed. |
| `validFrom` | date | `YYYY-MM-DD`. |
| `validTo` | date \| null | Optional. `YYYY-MM-DD`, on or after `validFrom`. Omit it or send `null` for no end date. |
| `items` | string[] | 1 to 50 questions, each 1 to 500 characters, trimmed. **Array order sets the display order**: the first entry gets `position` 1. |

```json
{
  "projectId": "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
  "name": "فحص السلامة اليومي",
  "validFrom": "2026-11-01",
  "validTo": "2026-12-31",
  "items": [
    "هل يرتدي العمال معدات الحماية؟",
    "هل منطقة العمل مسيجة؟"
  ]
}
```

**`201 Created`**: the [template detail](#template-detail).

**Errors:** `400` validation (including `validTo must be on or after validFrom`), `404` `Project not found`.

#### `GET /admin/templates`

Lists templates. Paginated. Newest first.

**Query**

| Param | Type | Rules |
| --- | --- | --- |
| `page`, `limit` | integer | See [Pagination](#pagination). |
| `projectId` | UUID | Optional. Returns only this project's templates. |

**`200 OK`**

```json
{
  "items": [
    {
      "id": "6f1e2d9a-3c4b-4a5e-8f70-1a2b3c4d5e6f",
      "name": "فحص السلامة اليومي",
      "validFrom": "2026-11-01",
      "validTo": "2026-12-31",
      "createdAt": "2026-10-31T09:00:00.000Z",
      "project": { "id": "9a8b…", "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1
}
```

List entries do not include items or assignees. Fetch the template by id to get them.

#### `GET /admin/templates/:id`

**`200 OK`**: the [template detail](#template-detail).

**Errors:** `400` bad UUID, `404` `Template not found`.

#### `PATCH /admin/templates/:id`

Updates a template. Send only the fields you want to change. At least one is required.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1 to 200 characters, trimmed. |
| `validFrom` | date | `YYYY-MM-DD`. |
| `validTo` | date \| null | `YYYY-MM-DD`. Send `null` to remove the end date. |
| `items` | string[] | Same rules as on create. **Replaces all items**, and every item gets a new id. Only allowed while the template has **no** submitted inspections. |

Changing the dates also changes which inspections can be submitted, because submits are checked against the dates stored when the submit arrives.

**`200 OK`**: the updated [template detail](#template-detail).

**Errors**

| Status | When |
| --- | --- |
| `400` | Validation failed, or `Nothing to update`. |
| `400` `validTo must be on or after validFrom` | Both dates were sent and are reversed. |
| `400` `Constraint failed: template_dates_chk` | Only one date was sent, and it conflicts with the stored date. |
| `404` `Template not found` | |
| `409` `Items cannot change after inspections were submitted; create a new template` | `items` was sent for a template that has been used. Nothing is changed, including the other fields in the request. |

To change the questions of a template that is already in use, create a new template, end the old one by setting its `validTo`, and assign the inspectors to the new one.

#### `POST /admin/templates/:id/assignments`

Gives inspectors access to the template. Assigning someone who is already assigned does nothing (their original `assignedAt` and work order number are kept). Each new assignment creates a work order with a generated `workOrderNumber`. The current admin is recorded as the assigner.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `userIds` | UUID[] | 1 to 200 ids. Duplicates are ignored. Every id must belong to an **active inspector**. |

```json
{ "userIds": ["c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f"] }
```

**`201 Created`**: the **full** list of assignees after the change, sorted by name.

```json
[
  {
    "id": "c3d4e5f6-a7b8-4c9d-8e0f-1a2b3c4d5e6f",
    "name": "أحمد علي",
    "email": "ahmed@example.com",
    "isActive": true,
    "workOrderNumber": "WO-000123",
    "completedAt": null,
    "assignedAt": "2026-10-31T09:05:00.000Z"
  }
]
```

**Errors**

| Status | When |
| --- | --- |
| `400` | Validation failed. |
| `400` `{ "message": "Only active inspectors can be assigned", "invalidUserIds": [...] }` | One or more ids are unknown, belong to an admin, or belong to a deactivated user. **Nobody is assigned** in this case. |
| `404` `Template not found` | |

#### `DELETE /admin/templates/:id/assignments/:userId`

Removes one inspector's access to the template. Inspections they already submitted are kept. Any forms they have not yet synced will return `403` when they try to submit.

**`204 No Content`**, with no body.

**Errors:** `400` bad UUID, `404` `Assignment not found`.

<a id="admin-inspections"></a>
### Inspections

These routes are read-only. Submitted inspections are final for admins too.

#### `GET /admin/inspections`

Lists every inspection. Paginated. Sorted by `filledAt`, newest first. All filters are optional and combine with AND.

**Query**

| Param | Type | Rules |
| --- | --- | --- |
| `page`, `limit` | integer | See [Pagination](#pagination). |
| `workOrder` | string | **Exact** work-order number, 1 to 50 characters, trimmed. |
| `projectId` | UUID | Inspections on any template of this project. |
| `templateId` | UUID | |
| `inspectorId` | UUID | |
| `from` | date-time | `filledAt >= from`. Needs a timezone offset. |
| `to` | date-time | `filledAt <= to`. Needs a timezone offset. |

Example: all inspections for one project during October 2026, Riyadh time:

```
GET /admin/inspections?projectId=9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d&from=2026-10-01T00:00:00%2B03:00&to=2026-10-31T23:59:59%2B03:00
```

URL-encode a `+` in an offset as `%2B`. Otherwise it arrives as a space and validation fails. Using `Z` avoids the problem.

**`200 OK`**: a [paginated](#pagination) list of [inspection summaries](#inspection-summary).

#### `GET /admin/inspections/:id`

**`200 OK`**: an [inspection detail](#inspection-detail) with `photoUrl` set to `/admin/inspections/:id/photo`.

**Errors:** `400` bad UUID, `404` `Inspection not found`.

#### `GET /admin/inspections/:id/photo`

Streams the photo of any inspection. Headers and errors are the same as [`GET /web/inspections/:id/photo`](#get-webinspectionsidphoto), including the need to fetch it with the `Authorization` header.

---

## Health check

### `GET /`

Public. Returns the plain string `Hello World!` with `200`. Useful as a liveness probe. It does not touch the database.

---

## Shared response shapes

### Inspection summary

Used by both inspection list endpoints.

```json
{
  "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "workOrderNumber": "WO-1042",
  "filledAt": "2026-10-31T06:15:00.000Z",
  "receivedAt": "2026-10-31T11:02:41.512Z",
  "template": { "id": "6f1e…", "name": "فحص السلامة اليومي" },
  "project": { "id": "9a8b…", "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" },
  "inspector": { "id": "c3d4…", "name": "أحمد علي" }
}
```

- `filledAt`: the device time when the form was filled, converted to UTC.
- `receivedAt`: the server time when the inspection first synced. The gap between the two shows how long the form waited offline.

### Inspection detail

A summary plus `photoUrl` and `answers`:

```json
{
  "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  "workOrderNumber": "WO-1042",
  "filledAt": "2026-10-31T06:15:00.000Z",
  "receivedAt": "2026-10-31T11:02:41.512Z",
  "template": { "id": "6f1e…", "name": "فحص السلامة اليومي" },
  "project": { "id": "9a8b…", "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" },
  "inspector": { "id": "c3d4…", "name": "أحمد علي" },
  "photoUrl": "/web/inspections/3f2504e0-4f89-41d3-9a0c-0305e82c3301/photo",
  "answers": [
    {
      "itemId": "11111111-1111-4111-8111-111111111111",
      "position": 1,
      "label": "هل يرتدي العمال معدات الحماية؟",
      "answer": "yes",
      "note": null
    },
    {
      "itemId": "22222222-2222-4222-8222-222222222222",
      "position": 2,
      "label": "هل منطقة العمل مسيجة؟",
      "answer": "no",
      "note": "السياج مكسور من الجهة الشمالية"
    }
  ]
}
```

- `photoUrl` is a path relative to the API base. It starts with `/web/inspections` or `/admin/inspections`, depending on which route returned it.
- `answers` is sorted by `position`. `label` is the question text **as it was at submission time**.

### Template detail

Returned by `GET`, `POST` and `PATCH` on `/admin/templates/:id`.

```json
{
  "id": "6f1e2d9a-3c4b-4a5e-8f70-1a2b3c4d5e6f",
  "name": "فحص السلامة اليومي",
  "validFrom": "2026-11-01",
  "validTo": "2026-12-31",
  "createdAt": "2026-10-31T09:00:00.000Z",
  "project": { "id": "9a8b…", "code": "PRJ-2026-001", "name": "مشروع الطريق الدائري" },
  "items": [
    { "id": "1111…", "position": 1, "label": "هل يرتدي العمال معدات الحماية؟" },
    { "id": "2222…", "position": 2, "label": "هل منطقة العمل مسيجة؟" }
  ],
  "assignees": [
    {
      "id": "c3d4…",
      "name": "أحمد علي",
      "email": "ahmed@example.com",
      "isActive": true,
      "assignedAt": "2026-10-31T09:05:00.000Z"
    }
  ],
  "inspectionCount": 0
}
```

- `items` is sorted by `position`. `assignees` is sorted by name.
- `inspectionCount > 0` means the items can no longer be replaced. The dashboard can use it to disable editing the questions.
