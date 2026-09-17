## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cross-device data sync

Records are shared across your laptop, phone, and tablet via a small Express
sync server that stores the dorm state to `data/dorm-state.json`.

1. Start the sync server (terminal 1):
   `npm run server`
2. Start the Vite dev server (terminal 2):
   `npm run dev`

The Vite dev server proxies `/api` to the sync server. In production, the sync
server also serves the built frontend — just run:

```
npm run build
npm start
```

Then open the app on the deployment URL from any device; the state is stored
server-side so records added on one device appear on the others. The frontend
polls the server every ~30 seconds and also re-syncs on every page load.

`PORT` (default 4000) and `DATA_DIR` (default `./data`) can be set via env vars.