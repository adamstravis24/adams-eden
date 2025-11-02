// Simple CORS proxy for Perenual API (dev only)
// Usage:
//   1) npm run proxy:perenual
//   2) Set EXPO_PUBLIC_PERENUAL_PROXY_URL to http://<your-ip>:3333
//   3) Use device/emulator or web

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // v2 CJS

const app = express();
const PORT = process.env.PORT || 3333;
const TARGET = 'https://perenual.com/api';

app.use(cors());

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Proxy any /v2/* path to Perenual API
app.use('/v2', async (req, res) => {
  try {
    const url = `${TARGET}${req.originalUrl}`; // originalUrl includes /v2/...
    const headers = { ...req.headers };
    // Sanitize headers that cause issues cross-domain
    delete headers.host; delete headers.origin; delete headers.referer; delete headers['accept-encoding'];
    const options = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req;
    }
    const upstream = await fetch(url, options);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(upstream.status);
    res.set('content-type', contentType);
    upstream.body.pipe(res);
  } catch (e) {
    res.status(502).json({ error: 'Proxy error', message: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Perenual proxy listening on http://localhost:${PORT}`);
});
