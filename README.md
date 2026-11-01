[العربية](README.ar.md) | **English**

# Muhaid — Tester Guide

It runs as three Docker containers:

| Container | What it is | Address |
|---|---|---|
| `frontend` | React web app (PWA) served by nginx | http://localhost:8081 |
| `backend` | NestJS API | http://localhost:3000 |
| `db` | PostgreSQL 17 (data kept in a Docker volume) | `127.0.0.1:5434` |

## 2. What you need

- **Docker Desktop**, installed and **running** (Windows, macOS or Linux). Check: `docker --version` and `docker compose version` both print a version.
- An **internet connection for the first build** (it downloads images and packages).
- A **Chromium-based browser** (Chrome, Edge or Brave) is recommended for the offline test.
- These ports free on your computer: **8080**, **3000**, **5434** (see Troubleshooting if not).

## 3. Start the system

Unzip the package. Open a terminal **inside the project folder** (the one that contains `docker-compose.yml`). On Windows: right-click the folder, then **Open in Terminal**.

**Step 1. Build the images and start the containers** (first time: a few minutes)

```bash
docker compose up -d --build
```

**Step 2. Check that everything is healthy**

```bash
docker compose ps
```

You should see `db`, `backend` and `frontend` with the status **healthy** (it can take up to a minute; run the command again if you see `starting`).

**Step 3. Create the database tables** (manual step, run once, and again after updating the code)

```bash
docker compose run --rm tools npm run db:migrate
```

Expected last line: `migrations applied successfully!`

**Step 4. Create the first admin account** (run once)

```bash
docker compose run --rm tools npm run db:seed
```

Expected: `Admin created: admin@muhaid.local`

> Steps 3 and 4 are manual on purpose: nothing changes the database unless you run it yourself. Until Step 3 is done, the app answers with errors.

**Step 5. Open the app** at **http://localhost:8080**

> Always use the address `localhost` exactly as written. Using `127.0.0.1` or your computer's IP address makes the browser block the API calls.

The app starts in Arabic. Click **English** (top corner) to switch the language. Click **العربية** to switch back.

## 4. Accounts

| Role | Email | Password |
|---|---|---|
| Admin (ready after Step 4) | `admin@muhaid.local` | `Admin_12345` |
| Inspector (you create it in section 5) | `inspector@muhaid.local` | `Inspector_123` |

Database (optional, for a tool such as TablePlus): host `127.0.0.1`, port `5434`, user `postgres`, password `muhaid_demo_2026`, database `muhaid`.

## 5. Prepare test data (as Admin, about 5 minutes)

Log in as the admin. The left menu has **Inspections**, **Projects**, **Templates** and **Users**.

1. **Create an inspector.** **Users** → **Add user**. Fill: Name `Test Inspector`, Email `inspector@muhaid.local`, Password `Inspector_123`, Role `Inspector`. Click **Create user**.
2. **Create a project.** **Projects** → **New project**. Project code `DEMO-001`, Project name `Demo Tower`. Click **Create project**.
3. **Create a template (the inspection form).** **Templates** → **New template**.
   - Project: search `DEMO` and pick `DEMO-001`.
   - Template name: `Daily Safety Check`.
   - Valid from: **today's date**. Tick **No end date**.
   - Questions: type the first question, then click **Add a question** for each next one. For example:
     1. `Are workers wearing protective equipment?`
     2. `Is the work area fenced?`
     3. `Are the fire extinguishers in place?`
   - Click **Create template**.
4. **Assign the inspector.** On the template page click **Assign inspectors**, tick `Test Inspector`, click **Assign 1 inspector**. A work order number (for example `WO-000001`) is generated automatically.

> Nobody sees a template until it is assigned. If the template's "Valid from" date is in the future, the inspector cannot fill it.

When you are done, log out (the icon in the top corner).

## 6. Test the inspector app and offline mode

### 6.1 Log in and load the forms (online)

1. Log in with `inspector@muhaid.local` / `Inspector_123`. You land on **Forms** (**Assigned forms**) and see `Daily Safety Check`.
2. **Stay online for a few seconds**, so the app and the forms are stored on the device. Optional check: press `F12` → **Application** → **Service Workers**; it should say *activated and is running*.

### 6.2 Test A: go offline and fill a form

1. Press `F12` → **Network** tab → in the throttling drop-down choose **Offline**.
2. A banner appears: *No connection. What you save stays on this device and is sent when there is a connection.*
3. Press `F5` to reload. **The app still opens** and the form list is still there.
4. Open `Daily Safety Check`. Answer every question (**Yes**, **No** or **N/A**). Every **No** needs a note.
5. Under **Inspection photo**, click **Take a photo** and choose the file **`sample-photo.jpg`** from the package folder (JPEG, PNG or WebP, up to 5 MB).
6. Click **Save inspection**. You see *Inspection saved on this device*.
7. Open **Outbox**. It shows `1 inspection waiting`.
8. Set the throttling back to **No throttling**. The outbox sends by itself; if nothing happens within a minute, click **Send now**.
9. Open **Sent**: the inspection is listed with its work order number and the sync status (**On time**, or *Sent … later* because it waited offline).

### 6.3 Test B: server really down

This is stronger than the browser's Offline switch, because the servers themselves stop.

1. Keep the inspector logged in with the app open. In the terminal run:

   ```bash
   docker compose stop frontend backend
   ```

2. Reload the page (`F5`). **The app still loads**, because the browser kept its own copy (service worker), even though the web server is stopped.
3. Fill and save another form exactly as in Test A. It goes to the **Outbox**.
4. Start the servers again:

   ```bash
   docker compose start backend frontend
   ```

5. Wait about a minute (or click **Send now** in the Outbox). The inspection moves to **Sent**.

> The app must have been opened at least once while online (6.1). A browser that never loaded it cannot open it offline.

### 6.4 Check the result as Admin

Log out, log in as `admin@muhaid.local`, open **Inspections**. The inspections you sent are listed. Open one to see the answers, the notes and the photo.

## 7. Everyday commands

| Goal | Command |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f backend` |
| Stop (keeps data) | `docker compose stop` |
| Start again | `docker compose start` |
| Remove containers (keeps data) | `docker compose down` |
| **Delete everything, including all data** | `docker compose down -v` (then repeat Steps 1, 3 and 4) |

## 8. Troubleshooting

| Problem | What to do |
|---|---|
| `port is already allocated` | Another program uses 8080, 3000 or 5434. Edit the `.env` file: change `FRONTEND_HOST_PORT` (and `CORS_ORIGIN` to match), or `BACKEND_HOST_PORT` (and `VITE_API_URL` to match), or `DB_HOST_PORT`. Example: `FRONTEND_HOST_PORT=8090` and `CORS_ORIGIN=http://localhost:8090`. Then run `docker compose up -d --build` and open the new address. |
| Login fails or the page shows server errors | Step 3 (migrate) or Step 4 (seed) was not run. Run them. |
| Browser console shows a **CORS** error | You opened the app with `127.0.0.1` or an IP address, or `CORS_ORIGIN` does not match the address in the browser bar. |
| Changed a port but the app still calls the old API address | `VITE_API_URL` is built into the frontend. Run `docker compose up -d --build` again. |
| After an update you still see the old screen | Close all tabs of the app, then open it again (updates wait until the app's tabs are closed). |
| `docker: command not found` or Docker errors | Start Docker Desktop and wait until it says it is running. |
| Offline reload shows an error page | The app was not opened online first, or the service worker is not active. Go online, open the app, wait a few seconds (check **Application → Service Workers**), then repeat. |
| A container is `unhealthy` | `docker compose logs backend` (or `db`, `frontend`) and read the last lines. |

## 9. What is inside the package

```
muhaid_company/
├─ README.md / README.ar.md   this guide (English / Arabic)
├─ docker-compose.yml    db + backend + frontend (+ tools for migrate/seed)
├─ .env                  demo settings (no real secrets)
├─ sample-photo.jpg      a photo to attach to a test inspection
├─ muhaid_backend/       NestJS + Drizzle ORM + PostgreSQL API (Dockerfile inside)
│   └─ docs/API.md       the API contract
└─ muhaid_frontend/      React + TypeScript + Vite PWA (Dockerfile + nginx.conf inside)
```

- Backend: NestJS 12, Drizzle ORM, PostgreSQL, JWT (Bearer token), photo upload with file-type checking.
- Frontend: React 19, TanStack Query (cache saved on the device), Dexie / IndexedDB (the offline outbox), a service worker for offline loading, Arabic and English with right-to-left support.
- Docker: multi-stage builds. The backend image runs as a non-root user. The frontend image is a small nginx image that serves the built files.

## 10. Shut down the containers

Run these in the project folder (the one that contains `docker-compose.yml`):

```
docker compose down
```

This stops and removes the containers and the network. **Your data is kept** in the database volume, so the next `docker compose up -d` starts with the same data.

To stop the containers without removing them, use `docker compose stop`. To delete everything including all data, use `docker compose down -v`. This cannot be undone.
