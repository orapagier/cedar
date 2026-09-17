// Vercel serverless function: GET/PUT /api/state.
// Backed by Vercel KV (Upstash-compatible REST API) so records written on any
// device persist and are shared across all signed-in users.
//
// Required environment variables (set in Vercel Console):
//   KV_REST_API_URL    e.g. https://free-shaman-12345.upstash.io
//   KV_REST_API_TOKEN  the REST token for that KV database

const KV_KEY = 'dorm-state';

async function kvGet(key) {
  const res = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  if (!res.ok) throw new Error('KV get failed');
  const body = await res.json();
  return body.result;
}

async function kvSet(key, value) {
  const res = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error('KV set failed');
}

export default async function handler(req, res) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'Vercel KV is not configured (KV_REST_API_URL / KV_REST_API_TOKEN). Add a Vercel KV store and link it to this project.' });
  }

  if (req.method === 'GET') {
    try {
      const raw = await kvGet(KV_KEY);
      if (raw == null) {
        return res.status(404).json({ error: 'No shared state saved yet' });
      }
      return res.status(200).json(JSON.parse(raw));
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read shared state' });
    }
  }

  if (req.method === 'PUT') {
    const { updatedAt, data } = req.body || {};
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid state payload' });
    }
    const now = Number(updatedAt) || Date.now();
    try {
      await kvSet(KV_KEY, { updatedAt: now, data });
      return res.status(200).json({ ok: true, updatedAt: now });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save shared state' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}