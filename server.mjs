import http from 'node:http';
import https from 'node:https';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, getCatalog, root } from './database.mjs';
import { matchText } from './recognition.mjs';
import { discoverSign, providerStatus } from './discovery.mjs';
import { createContribution, getCommunityCatalog, matchCommunity, voteContribution } from './community.mjs';
const db = openDatabase(process.env.SIGN_DATABASE || path.join(root, 'data/signs.sqlite'));
const discoveryCache = new Map();
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.apk': 'application/vnd.android.package-archive', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.wasm': 'application/wasm', '.traineddata': 'application/octet-stream' };

function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  try {
    if (new URL(origin).host === req.headers.host) return origin;
  } catch { return false; }
  const configured = String(process.env.SIGN_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  return configured.includes(origin) ? origin : false;
}
function acceptWriteOrigin(req, res) {
  const origin = allowedOrigin(req);
  if (origin === false) { json(res, 403, { error: 'Cross-origin requests are not accepted.' }); return false; }
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  return true;
}
async function readJson(req, res, maxBytes) {
  if (!req.headers['content-type']?.startsWith('application/json')) { json(res, 415, { error: 'JSON is required.' }); return undefined; }
  let body = '', bytes = 0;
  for await (const chunk of req) { bytes += chunk.length; if (bytes > maxBytes) { json(res, 413, { error: 'Request too large.' }); return undefined; } body += chunk; }
  try { return JSON.parse(body); } catch { json(res, 400, { error: 'Invalid JSON.' }); return undefined; }
}
function staticPath(urlPath) {
  const direct = ['prototype-ax.html', 'prototype.html', 'ax.css', 'ax.js', 'web-bridge.js', 'SignBySign-Android.apk', 'data/catalog-inline.js', 'data/community-catalog.json'];
  const relative = urlPath === '/' ? 'prototype-ax.html' : urlPath.slice(1);
  if (direct.includes(relative)) return path.join(root, relative);
  const localVendor = path.join(root, 'vendor');
  const mounts = { 'assets/': path.join(root, 'assets'), 'vendor/tesseract/': path.join(localVendor, 'tesseract'), 'vendor/core/': path.join(localVendor, 'core'), 'ocr-data/': path.join(root, 'ocr-data') };
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
    if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      if (!acceptWriteOrigin(req, res)) return;
      res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' });
      return res.end();
    }
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      const base = getCatalog(db), community = getCommunityCatalog(db);
      return json(res, 200, { ...base, version: Math.max(base.version, community.version), cards: base.cards.concat(community.cards) });
    }
    if (req.method === 'GET' && url.pathname === '/api/community') {
      const origin = allowedOrigin(req);
      if (origin === false) return json(res, 403, { error: 'Cross-origin requests are not accepted.' });
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
      return json(res, 200, getCommunityCatalog(db));
    }
    if (req.method === 'GET' && url.pathname === '/api/health') {
      const community = getCommunityCatalog(db);
      return json(res, 200, { ok: true, database: 'SQLite', signs: db.prepare('SELECT count(*) n FROM signs').get().n, discovery: providerStatus(), community: { pending: community.pending.length, published: community.cards.length, version: community.version } });
    }
    if (req.method === 'POST' && url.pathname === '/api/community/contributions') {
      if (!acceptWriteOrigin(req, res)) return;
      const input = await readJson(req, res, 650000); if (input === undefined) return;
      try { return json(res, 201, createContribution(db, input)); }
      catch (error) { if (error instanceof TypeError) return json(res, 400, { error: error.message }); throw error; }
    }
    const communityVoteMatch = url.pathname.match(/^\/api\/community\/contributions\/([0-9a-f-]{36})\/vote$/);
    if (req.method === 'POST' && communityVoteMatch) {
      if (!acceptWriteOrigin(req, res)) return;
      const input = await readJson(req, res, 4096); if (input === undefined) return;
      try {
        const result = voteContribution(db, communityVoteMatch[1], input);
        return result ? json(res, 200, result) : json(res, 404, { error: 'Contribution not found.' });
      } catch (error) { if (error instanceof TypeError) return json(res, 400, { error: error.message }); throw error; }
    }
    if (req.method === 'POST' && url.pathname === '/api/match') {
      if (!acceptWriteOrigin(req, res)) return;
      const input = await readJson(req, res, 16384); if (input === undefined) return;
      if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.text !== 'string' || input.text.trim().length === 0 || input.text.length > 2000 || !['ocr', 'manual'].includes(input.source) || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 100) return json(res, 400, { error: 'Invalid text, source or confidence.' });
      const base = matchText(db, input);
      const shared = matchCommunity(db, input);
      return json(res, 200, shared && (base.status === 'no_match' || (base.status === 'candidates' && shared.status === 'matched')) ? shared : base);
    }
    if (req.method === 'POST' && url.pathname === '/api/discover') {
      if (!acceptWriteOrigin(req, res)) return;
      const input = await readJson(req, res, 4096); if (input === undefined) return;
      if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.text !== 'string' || input.text.trim().length === 0 || input.text.length > 120 || !['ko', 'en', 'ja'].includes(input.language)) return json(res, 400, { error: 'Invalid sign name or language.' });
      const key = `${input.language}:${input.text.trim().normalize('NFKC').toLocaleLowerCase('en')}`;
      const cached = discoveryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) return json(res, 200, cached.value);
      const value = await discoverSign({ text: input.text, language: input.language });
      discoveryCache.set(key, { value, expiresAt: Date.now() + 60 * 60 * 1000 });
      if (discoveryCache.size > 200) discoveryCache.delete(discoveryCache.keys().next().value);
      return json(res, 200, value);
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
server.listen(Number(process.env.SIGN_PORT || process.env.PORT || 4173), process.env.SIGN_HOST || process.env.HOST || '127.0.0.1', () => {
  const address = server.address();
  console.log(`Sign by Sign AX: ${tls ? 'https' : 'http'}://${address.address}:${address.port}/prototype-ax.html`);
});
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
