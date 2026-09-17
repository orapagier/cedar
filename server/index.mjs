import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'dorm-state.json');
const PORT = process.env.PORT || 4000;

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeState(updatedAt, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const now = Number(updatedAt) || Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ updatedAt: now, data }, null, 2), 'utf8');
  return now;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Read the shared dorm state (single source of truth across devices)
app.get('/api/state', (_req, res) => {
  const state = readState();
  if (!state) return res.status(404).json({ error: 'No shared state saved yet' });
  res.json(state);
});

// Save the shared dorm state
app.put('/api/state', (req, res) => {
  const { updatedAt, data } = req.body || {};
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid state payload' });
  }
  const saved = writeState(updatedAt, data);
  res.json({ ok: true, updatedAt: saved });
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
  console.log(`Shared state file: ${STATE_FILE}`);
});