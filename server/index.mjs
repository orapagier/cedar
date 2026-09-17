import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'dorm-state.json');
const KV_KEY = 'dorm-state';
const PORT = process.env.PORT || 4000;

// When Vercel KV env vars are present, the server uses KV (shared, durable).
// Otherwise it falls back to a local JSON file (dev / single-instance hosting).
const useKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function readState() {
  if (useKv) {
    const res = await fetch(`${process.env.KV_REST_API_URL}/get/${KV_KEY}`, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body.result == null) return null;
    return JSON.parse(body.result);
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

async function writeState(updatedAt, data) {
  const now = Number(updatedAt) || Date.now();
  const payload = { updatedAt: now, data };
  if (useKv) {
    const res = await fetch(`${process.env.KV_REST_API_URL}/set/${KV_KEY}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('KV set failed');
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(payload, null, 2), 'utf8');
  }
  return now;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Read the shared dorm state (single source of truth across devices)
app.get('/api/state', async (_req, res) => {
  try {
    const state = await readState();
    if (!state) return res.status(404).json({ error: 'No shared state saved yet' });
    res.json(state);
  } catch {
    res.status(500).json({ error: 'Failed to read shared state' });
  }
});

// Save the shared dorm state
app.put('/api/state', async (req, res) => {
  const { updatedAt, data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid state payload' });
  }
  try {
    const saved = await writeState(updatedAt, data);
    res.json({ ok: true, updatedAt: saved });
  } catch {
    res.status(500).json({ error: 'Failed to save shared state' });
  }
});

// Serve the built frontend in production (single server serves files + API)
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Cedar Hall sync server listening on http://localhost:${PORT}`);
  if (useKv) {
    console.log('Shared state store: Vercel KV');
  } else {
    console.log(`Shared state file: ${STATE_FILE}`);
  }
});