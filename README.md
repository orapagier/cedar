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

## Leaving campus without a gate pass

A pass is how a resident leaves Cedar Hall. **Off-Campus Without Pass** is the
register for the times that did not happen — a resident found in town, missing
from a roll call, or spotted coming back through the fence line.

Records are filed room by room from the resident's own row, the way a pass is
issued. Each row says up front whether a pass already covers today, so an exit
is never logged over leave that was on file. The record keeps when the exit was
noticed, where the resident went (blank if nobody knows), how it came to light —
gate guard, roll call, staff sighting, a report, or the resident's own admission
— whether they are back in the dormitory, and whether the parents have been
told.

A confirmed exit is **1 pt** and calls for a dean inquiry with the parents
before any further pass is issued, and it shows on the resident's Occupant
Records and on their parent's view. Residents still off campus are counted
separately from those already back, so a glance at the register says who is
unaccounted for right now.

If leave turns out to have been on file after all, **Excuse** the record with a
reason: it stays in the register with what settled it, and the point is
withdrawn. **Reinstate** puts it back. Either way the resident is never asked to
work off a point the dormitory has taken back.

## Cursing, swearing and foul language

**Foul Language** is the register of how residents speak to one another. A
resident heard cursing, swearing, mocking another boy or taking God's name in
vain is recorded room by room from their own row, the way every other check is
taken.

Each report says what kind of language it was — cursing or swearing, vulgar
talk, blasphemy, name-calling, or speech meant to threaten or degrade — where in
dormitory life it was heard, and how it came to light: staff heard it, someone
reported it, the resident admitted it, or it was written down or posted in a
group chat. There is room for **the words themselves**, kept verbatim so a dean
inquiry is not working from memory, and it can be left blank if you would rather
not write them down.

Naming **who it was said to** asks the resident for an apology as well as a
reflection, and the register counts how many apologies are still owed. Each
resident's row also shows how many confirmed reports they have picked up in the
last 30 days, so a first slip and a standing habit are not read the same way.

A confirmed report is **1 pt** and a reflection on clean speech with the dean,
and it shows on the resident's Occupant Records and on their parent's view. The
grade the dormitory puts on it follows the words, not the volume: a cuss word
said in temper is minor, God's name taken in vain or mockery of another resident
is moderate, and language meant to threaten or degrade is major.

If the words turn out not to have been his — misheard, or another resident —
**Excuse** the record with a reason: it stays in the register with what settled
it, and the point is withdrawn. **Reinstate** puts it back.

## Saving a check one resident at a time

Residents do not move as a room. They drift to vespers in ones and twos, leave
for school as they are ready, and hand their phones in across the evening — so a
check that can only be filed once the whole room is accounted for is a check
that cannot be taken at all.

Every roll call therefore saves **per resident as well as per room**. Each row
carries its own **Save** button beside the marks, and the footer button now
reads **Save All** for the times a room really is together. This applies to:

- **Worship roll call** — the six weekly services
- **Curfew check-in**
- **Study hours**
- **School departure & uniform** — each run, morning and afternoon
- **Phone vault deposits**

Room inspections, the daily cleaning duty and the lights-out round stay room-wide,
because what they grade is the room itself rather than the boys in it.

**Saving a name twice never files it twice.** One record is kept per resident per
check per day — per service for worship, per run for departures, per cycle for
the phone vault — so a boy logged on his own and then swept up again in the
room's **Save All** ends with a single record and a single point. Saving him
again corrects what is on file, keeping the record's id, so a point he has
already redeemed stays redeemed and a correction never asks him to work it off
twice.

Because of this, each row shows what is **already on file** — the verdict and the
time it was taken — and opens with those marks rather than with blank defaults.
The room header counts how far the check has got (`3/5 logged`), and the row's
button reads **Update** rather than **Save** once a record exists.

Worship, study hours and departures also offer **All rooms** in the room picker,
which lists the whole dormitory as one queue sorted by room. That is the roll
call taken standing at the church door or the gate, marking boys off as they
arrive, rather than walking the building room by room.

## Occupant Records

Every resident's file, filed the way the dormitory is walked: **by room**. Each
room is a card carrying its wing, its captain and the points its residents have
between them, with the names inside it. Tap a name and their whole record opens
as a popup over the roster — full screen on a phone, and the roster is still
there when it closes.

The record itself is five tabs rather than one long column:

- **Overview** — the numbers that decide a standing (points, open violations,
  worship kept, room cleanliness), who to call, who he rooms with, and a
  **recent activity feed**: every module's entries — worship, curfew, study,
  passes, violations — merged into one dated list, newest first.
- **Attendance** — worship roll calls, study hours, curfew.
- **Conduct** — off-campus without a pass, foul language, violations, redemptions.
- **Daily** — school departures, cleaning duty, the phone vault.
- **Away & Health** — gate passes and medical slips.

The arrows in the header (or the left/right keys) step to the next resident
without going back to the list, so a room can be read boy after boy. Above the
rooms: a search across name, room, email and parent name, filters for
**With points** and **On notice**, and a switch to a flat A–Z list when the room
is not what you are looking for.

## Installing it on a phone

Cedar Hall is a **PWA**, so it installs from the browser onto an Android home
screen — no Play Store listing, no native app to build or sign. On Chrome for
Android the app offers an **Install** banner (also in the menu drawer, under the
sign-out row); on an iPhone, Safari's Share sheet has **Add to Home Screen**.

Once installed it opens full screen with no browser bar, keeps the cedar as its
launcher icon, and long-pressing that icon on Android jumps straight to
**Occupant Records**, **Worship Roll Call**, **Curfew** or **Room Check**.

A service worker (`public/sw.js`) caches the app shell, so a launch in a
corridor with poor signal still paints. **Records are never cached**: everything
behind `/api/state` always goes to the network, because a stale roll call read
out of a cache would be worse than none. When a new version is deployed the app
shows a **Reload** bar rather than swapping itself out mid-roll-call.

The launcher icons are generated from `public/icons/icon.svg` (rounded tile) and
`public/icons/icon-maskable.svg` (full-bleed, for Android's adaptive shapes):

```
magick -background none public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
magick public/icons/icon-maskable.svg -resize 512x512 public/icons/maskable-512.png
```

## Correcting a check after it is filed

Administrators file checks; the Dean is the one who can go back and change one
afterwards — **whoever took it**. Every register (room inspections, worship roll
calls, curfew, departures, study hours, cleaning, lights-out rounds, phone
deposits) carries a pencil and a bin beside each record, visible to the Super
Admin only — off-campus-without-pass and foul language records included.

- **Override** reopens that record's checks. Saving re-scores it — an inspection
  score, a gate clearance, a lights-out verdict all recompute — and the record
  keeps a note of who corrected it and when, while still crediting the
  administrator who originally filed it.
- Whatever the record put on a resident's standing follows the correction: a
  point it raised is withdrawn when the verdict is reversed, and a point a
  corrected record still implies stays exactly where it was. **A point the
  resident has already redeemed keeps its redemption** — correcting the check
  behind it never asks them to work it off twice.
- **Delete** strikes the record off the register and takes its points with it.

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