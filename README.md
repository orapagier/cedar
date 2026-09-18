## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in your values
   (`GEMINI_API_KEY`, optionally `VITE_GOOGLE_CLIENT_ID`).
3. Run the app:
   `npm run dev`

## Sign in with Google

Cedar Hall uses Google Identity Services. The login screen resolves roles purely
from the verified Google email:

- `orapajelmar@gmail.com` — always the **Dean (Super Admin)**. Implicit, no account setup needed.
- An email registered on a **resident's record** — that occupant (read-only).
- An **admin email** added under **Staff & Access** — that administrator (write access).
- A **parent email** saved on a student's record (Parent Google Email field) — a read-only parent scoped to that child.
- Any other Google account — **Guest** (can open the app but sees no dormitory records).

To enable the real Google button, set a **Google Web OAuth Client ID**
(`VITE_GOOGLE_CLIENT_ID`). Without it, the login screen shows a labeled
dev-preview fallback that resolves roles with the exact same email logic.

## Cross-device data sync

Records are shared across every device and role (Dean, staff, residents, and
parents) through a shared `/api/state` endpoint:

1. Start the sync server (terminal 1):
   `npm run server`
2. Start the Vite dev server (terminal 2):
   `npm run dev`

The Vite dev server proxies `/api` to the sync server. In production, the sync
server also serves the built frontend:

```
npm run build
npm start
```

The frontend pulls the shared state on load and every ~30 seconds, and pushes
debounced changes — so a check recorded on your laptop shows up on the phone for
you, your residents, and linked parents.

The poll itself is cheap. Every ~30 seconds a device asks `GET /api/state?meta=1`,
which answers with the last-saved timestamp and nothing else (a few dozen bytes).
The records are only fetched when that timestamp has actually moved. A tab that
is hidden — a phone in a pocket between roll calls — polls nothing at all and
catches up the moment it is looked at again. A push whose bytes match what the
server already holds is skipped, so a device that pulls someone else's change
does not echo it straight back.

### How the store works

- **Dev / single-instance:** stores `data/dorm-state.json` (`DATA_DIR`).
- **Vercel:** sees `KV_REST_API_URL` + `KV_REST_API_TOKEN` and uses
  **Vercel KV** through `api/state.mjs` instead — required because Vercel
  functions have no writable filesystem.

## Will the free database fill up?

Not on storage. A 30-resident dormitory running every check writes roughly
**57 KB per school day** — about **1.2 MB a month**, or **12 MB over a 10-month
school year**. The free KV tier holds 256 MB, so a decade of records would fit.

The real limit is the **shape** of the store, not its size: everything lives in
one JSON blob, and every save sends the whole blob in a single request. The free
Upstash/Vercel KV REST tier **rejects a request body over 1 MB**. That is the
wall — reached after roughly a term of daily checks, long before storage is a
concern.

So the routine is:

1. Open **Admin → Data & Storage**. The bar shows the live payload against a
   900 KB budget (just under the 1 MB ceiling), with the growth rate and how
   long the store has left at that rate.
2. **Download full backup** at the end of every term, and before archiving.
3. **Archive closed-out records**: pick a cutoff, and every dated log before it
   downloads as a JSON archive and leaves the live store. The roster, rooms,
   phone register, medical sheets and schedules are never touched — only the
   daily logs that pile up.

Archived violations stop counting toward a resident's standing and disappear
from their Occupant Records page, so only archive terms that are settled.

If the dormitory outgrows that rhythm — many more residents, or nobody to run
the archive — the durable fix is to move off the single-blob store onto a
row-based database (Supabase or Neon both have free Postgres tiers), so a save
sends one changed row instead of the whole year.

## Violations and redemption

Every violation is worth a flat **1 point**, and each one is redeemed on its
own — there is no clearing a resident's record in a lump. Under **Resident
Performance**, each pending violation carries its own **Redeem** button, which
asks how that single violation was paid off:

- **Work Service** — a work detail (grounds, library, dorm maintenance, kitchen)
  and the hours rendered.
- **Written Reflection** — a topic and the reflection the resident wrote, kept
  verbatim on the record.

Either way the redemption is signed off by a staff member with a completion
date, only that violation clears, and the resident's points drop by that one
point. Redeemed violations stay visible with what was done to settle them, on
both the Resident Performance page and the resident's Occupant Records, and a
redemption can be undone if it was logged by mistake.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: Vite).
2. In the **Vercel Console → your project → Settings → Environment Variables**, add:

   | Name                    | Value |
   | ----------------------- | ----- |
   | `VITE_GOOGLE_CLIENT_ID` | your Google Web OAuth Client ID |
   | `KV_REST_API_URL`       | from your Vercel KV store |
   | `KV_REST_API_TOKEN`     | from your Vercel KV store |

   `VITE_GOOGLE_CLIENT_ID` is baked in at build time, so it only applies to NEW
   deployments — after adding it, redeploy.

3. Create a Vercel KV store (Storage → Create Database → KV) and copy its
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` into the variables above. KV is what
   makes records persist across devices and deployments.

`.env.example` documents the same variables for local `.env.local` use.

### Google Cloud Console setup (one-time)

1. Go to console.cloud.google.com → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins**, add your deployed origin, e.g.
   `https://your-project.vercel.app` (and `http://localhost:3000` for local dev).
4. Copy the full Client ID (ends in `.apps.googleusercontent.com`) into the
   `VITE_GOOGLE_CLIENT_ID` variable on Vercel and redeploy.