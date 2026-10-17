import http from 'node:http';
import https from 'node:https';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, getCatalog, root } from './database.mjs';
import { matchText } from './recognition.mjs';
const db = openDatabase(process.env.SIGN_DATABASE || path.join(root, 'data/signs.sqlite'));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.traineddata': 'application/octet-stream' };

function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function staticPath(urlPath) {
  const direct = ['prototype-ax.html', 'prototype.html', 'ax.css', 'ax.js'];
  const relative = urlPath === '/' ? 'prototype-ax.html' : urlPath.slice(1);
  if (direct.includes(relative)) return path.join(root, relative);
  const mounts = { 'assets/': path.join(root, 'assets'), 'vendor/tesseract/': path.join(root, 'node_modules/tesseract.js/dist'), 'vendor/core/': path.join(root, 'node_modules/tesseract.js-core'), 'ocr-data/': path.join(root, 'ocr-data') };
  for (const [prefix, base] of Object.entries(mounts)) if (relative.startsWith(prefix)) {
    const target = path.resolve(base, relative.slice(prefix.length));
    if (target.startsWith(base + path.sep) && types[path.extname(target)]) return target;
  }
  return null;
}

const handler = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/catalog') return json(res, 200, getCatalog(db));
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, database: 'SQLite', signs: db.prepare('SELECT count(*) n FROM signs').get().n });
    if (req.method === 'POST' && url.pathname === '/api/match') {
      if (req.headers.origin) {
        let originHost;
        try { originHost = new URL(req.headers.origin).host; } catch {}
        if (originHost !== req.headers.host) return json(res, 403, { error: 'Cross-origin requests are not accepted.' });
      }
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'JSON is required.' });
      let body = '', bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 16384) return json(res, 413, { error: 'Request too large.' }); body += chunk; }
      let input; try { input = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON.' }); }
      if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.text !== 'string' || input.text.trim().length === 0 || input.text.length > 2000 || !['ocr', 'manual'].includes(input.source) || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 100) return json(res, 400, { error: 'Invalid text, source or confidence.' });
      return json(res, 200, matchText(db, input));
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    let filename; try { filename = staticPath(decodeURIComponent(url.pathname)); } catch { return json(res, 400, { error: 'Invalid path.' }); }
    if (!filename) return json(res, 404, { error: 'Not found.' });
    let stat; try { stat = statSync(filename); } catch { return json(res, 404, { error: 'File not found. Run npm install and npm run assets:ocr if OCR assets are missing.' }); }
    if (!stat.isFile()) return json(res, 404, { error: 'Not found.' });
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)], 'Content-Length': stat.size, 'Cache-Control': /\.(html|js|css)$/.test(filename) ? 'no-cache' : 'public, max-age=3600' });
    if (req.method === 'HEAD') res.end(); else createReadStream(filename).on('error', () => res.destroy()).pipe(res);
  } catch (error) { console.error(error.message); if (!res.headersSent) json(res, 500, { error: 'Could not process the request.' }); else res.end(); }
};
const tls = process.env.SSL_CERT && process.env.SSL_KEY;
const server = tls ? https.createServer({ cert: readFileSync(process.env.SSL_CERT), key: readFileSync(process.env.SSL_KEY) }, handler) : http.createServer(handler);
server.requestTimeout = 15000;
server.listen(Number(process.env.PORT || 4173), process.env.HOST || '127.0.0.1', () => {
  const address = server.address();
  console.log(`Sign by Sign AX: ${tls ? 'https' : 'http'}://${address.address}:${address.port}/prototype-ax.html`);
});
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
