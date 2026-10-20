import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { root } from '../database.mjs';

let child, base;
before(async () => {
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: root, env: { ...process.env, PORT: '0', HOST: '127.0.0.1', SIGN_DATABASE: ':memory:', SSL_CERT: '', SSL_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Test server startup timed out')), 10000);
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { base = `http://127.0.0.1:${match[1]}`; clearTimeout(timer); resolve(); }
    });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { if (!base) { clearTimeout(timer); reject(new Error(`Test server exited: ${code}`)); } });
  });
});
after(async () => { if (child && child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; } });

const post = (input, headers = {}) => fetch(base + '/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input) });

test('HTTP serves the full webpage and database catalog', async () => {
  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  const html = await page.text();
  assert.match(html, /ax\.js/);
  assert.match(html, /data-feature="travel-sign-scanner"/);
  const client = await (await fetch(base + '/ax.js')).text();
  const styles = await (await fetch(base + '/ax.css')).text();
  assert.match(client, /data-action="quick-camera"/);
  assert.match(client, /usePhoto\(event\.target\.files\[0\], true\)/);
  assert.match(client, /mapSearchLinks\(camera\.text\)/);
  assert.match(client, /class="scan-result travel-result"/);
  assert.match(client, /guide\.experience\[state\.language\]/);
  assert.match(client, /function detectedPlaceName\(card\)/);
  assert.match(client, /function showSampleScan\(id\)/);
  assert.match(client, /URLSearchParams\(window\.location\.search\)/);
  assert.match(styles, /\.quick-camera-btn\s*\{/);
  assert.match(styles, /\.useful-language\s+li\s*\{/);
  const catalog = await (await fetch(base + '/api/catalog')).json();
  assert.equal(catalog.cards.length, 12);
  assert.equal(catalog.categories.length, 4);
  for (const filename of ['/ax.js', '/ax.css', '/vendor/tesseract/tesseract.min.js', '/vendor/tesseract/worker.min.js', '/vendor/core/tesseract-core-simd-lstm.wasm.js', '/assets/ax/generated/mega.png']) {
    assert.equal((await fetch(base + filename, { method: 'HEAD' })).status, 200, filename);
  }
});

test('HTTP matching returns exact, uncertain, ambiguous and unknown states', async () => {
  for (const [text, source, confidence, status] of [
    ['메가커피', 'manual', 0, 'matched'], ['약국', 'ocr', 40, 'candidates'],
    ['약국\n병원', 'ocr', 95, 'ambiguous'], ['세탁소', 'manual', 0, 'no_match']
  ]) {
    const response = await post({ text, source, confidence });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, status);
  }
});

test('invalid API inputs are rejected without crashing', async () => {
  for (const input of [null, [], {}, { text: '', source: 'manual', confidence: 0 }, { text: '약국', source: 'other', confidence: 0 }, { text: '약국', source: 'ocr', confidence: -1 }, { text: '약국', source: 'ocr', confidence: 101 }, { text: '가'.repeat(2001), source: 'manual', confidence: 0 }]) {
    assert.equal((await post(input)).status, 400);
  }
  assert.equal((await fetch(base + '/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await fetch(base + '/api/match', { method: 'POST', body: '약국' })).status, 415);
  assert.equal((await post({ text: 'a'.repeat(17000), source: 'manual', confidence: 0 })).status, 413);
  assert.equal((await fetch(base + '/api/health')).status, 200);
});

test('database/source files, traversal, cross-origin writes and unexpected methods are blocked', async () => {
  for (const url of ['/data/signs.sqlite', '/data/seed.json', '/server.mjs', '/package.json', '/assets/%2e%2e%2fdata%2fsigns.sqlite', '/vendor/core/%2e%2e%2f%2e%2e%2fpackage.json']) {
    assert.equal((await fetch(base + url)).status, 404, url);
  }
  for (const origin of ['https://other.example', 'null', 'malformed']) {
    assert.equal((await post({ text: '약국', source: 'manual', confidence: 0 }, { Origin: origin })).status, 403);
  }
  assert.equal((await fetch(base + '/api/catalog', { method: 'DELETE' })).status, 405);
});
