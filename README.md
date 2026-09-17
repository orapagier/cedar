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

### How the store works

- **Dev / single-instance:** stores `data/dorm-state.json` (`DATA_DIR`).
- **Vercel:** sees `KV_REST_API_URL` + `KV_REST_API_TOKEN` and uses
  **Vercel KV** through `api/state.mjs` instead — required because Vercel
  functions have no writable filesystem.

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