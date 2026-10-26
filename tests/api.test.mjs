import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { root } from '../database.mjs';

let child, base;
before(async () => {
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: root, env: { ...process.env, PORT: '0', HOST: '127.0.0.1', SIGN_DATABASE: ':memory:', SSL_CERT: '', SSL_KEY: '', SIGN_ALLOWED_ORIGINS: 'http://localhost', NAVER_SEARCH_CLIENT_ID: '', NAVER_SEARCH_CLIENT_SECRET: '', GOOGLE_PLACES_API_KEY: '' },
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
const discover = (input, headers = {}) => fetch(base + '/api/discover', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input) });
const contribute = (input, headers = {}) => fetch(base + '/api/community/contributions', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(input) });

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
  assert.match(client, /function discoverUnknown\(run\)/);
  assert.match(client, /SignNative\.discoverPlace/);
  assert.match(client, /discovery\.category === "unknown"/);
  assert.match(client, /refreshDiscovery = screen === "camera"/);
  assert.match(client, /await discoverUnknown\(discoveryRun\)/);
  assert.match(client, /discoveryCategory === "bar" \? "restaurant"/);
  assert.match(client, /suggestedSubcategoryId = discoveryCategory === "bar" \? "pub"/);
  assert.match(client, /renderDiscoveryResult/);
  assert.match(client, /class="scan-result travel-result"/);
  assert.match(client, /guide\.experience\[state\.language\]/);
  assert.match(client, /function detectedPlaceName\(card\)/);
  assert.match(client, /function showSampleScan\(id\)/);
  assert.match(client, /URLSearchParams\(window\.location\.search\)/);
  assert.match(styles, /\.quick-camera-btn\s*\{/);
  assert.match(styles, /\.useful-language\s+li\s*\{/);
  const catalog = await (await fetch(base + '/api/catalog')).json();
  assert.equal(catalog.cards.length, 22);
  assert.equal(catalog.categories.length, 4);
  for (const filename of ['/ax.js', '/ax.css', '/vendor/tesseract/tesseract.min.js', '/vendor/tesseract/worker.min.js', '/vendor/core/tesseract-core-simd-lstm.wasm.js', '/assets/ax/generated/mega.png']) {
    assert.equal((await fetch(base + filename, { method: 'HEAD' })).status, 200, filename);
  }
});

test('unknown signs receive a useful discovery card instead of a dead end', async () => {
  const knownBrand = await discover({ text: '빽다방', language: 'ko' });
  assert.equal(knownBrand.status, 200);
  const knownPayload = await knownBrand.json();
  assert.equal(knownPayload.category, 'cafe');
  assert.ok(knownPayload.phrases.length >= 2);

  const unknown = await discover({ text: '새로운상점123', language: 'ko' });
  assert.equal(unknown.status, 200);
  const unknownPayload = await unknown.json();
  assert.equal(unknownPayload.status, 'guidance');
  assert.ok(unknownPayload.phrases.length >= 3);
  assert.equal(unknownPayload.searchLinks.length, 2);

  const pub = await discover({ text: '역전할머니맥주', language: 'ko' });
  assert.equal(pub.status, 200);
  const pubPayload = await pub.json();
  assert.equal(pubPayload.category, 'bar');
  assert.match(pubPayload.description, /맥주/);
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

test('one user submission is visible to another and becomes public after independent verification', async () => {
  const created = await contribute({
    storeName: '함께배움카페', ocrText: '함께배움카페', category: 'cafe', subcategory: 'coffee_shop', description: '여행자가 쉬어갈 수 있는 동네 카페',
    consent: true, photoConsent: false, photoData: '', clientId: 'client-user-a-0001'
  });
  assert.equal(created.status, 201);
  const candidate = await created.json();
  assert.equal(candidate.status, 'pending');
  assert.equal(candidate.confirmations, 1);

  const userBView = await (await fetch(base + '/api/community')).json();
  assert.ok(userBView.pending.some(item => item.id === candidate.id && item.storeName === '함께배움카페'));

  const verified = await fetch(`${base}/api/community/contributions/${candidate.id}/vote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote: 'confirm', clientId: 'client-user-b-0002' })
  });
  assert.equal(verified.status, 200);
  const verifiedPayload = await verified.json();
  assert.equal(verifiedPayload.status, 'published');
  assert.equal(verifiedPayload.confirmations, 2);

  const publicCatalog = await (await fetch(base + '/api/community')).json();
  assert.ok(publicCatalog.cards.some(card => card.korean === '함께배움카페' && card.category === 'cafe'));
  assert.ok(!publicCatalog.pending.some(item => item.id === candidate.id));

  const sharedMatch = await post({ text: '함께배움카페', source: 'manual', confidence: 0 });
  const sharedMatchPayload = await sharedMatch.json();
  assert.equal(sharedMatchPayload.status, 'matched');
  assert.match(sharedMatchPayload.matchedId, /^community-/);
});

test('photo upload requires separate consent and support requests are accepted', async () => {
  const contribution = await contribute({
    storeName: '개인정보분리약국', ocrText: '개인정보분리약국', category: 'medical', subcategory: 'pharmacy', description: '테스트 약국',
    consent: true, photoConsent: false, photoData: 'data:image/jpeg;base64,AAAA', clientId: 'client-privacy-0001'
  });
  assert.equal(contribution.status, 201);
  assert.equal((await contribution.json()).hasPhoto, false);

  const support = await fetch(base + '/api/support', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'inquiry', email: 'tester@example.com', message: '앱 서버 연결 문의입니다.', context: { screen: 'settings' }, clientId: 'client-support-0001' })
  });
  assert.equal(support.status, 201);
  assert.equal((await support.json()).status, 'open');
  const health = await (await fetch(base + '/api/health')).json();
  assert.equal(health.support.open, 1);
});

test('invalid API inputs are rejected without crashing', async () => {
  for (const input of [null, [], {}, { text: '', source: 'manual', confidence: 0 }, { text: '약국', source: 'other', confidence: 0 }, { text: '약국', source: 'ocr', confidence: -1 }, { text: '약국', source: 'ocr', confidence: 101 }, { text: '가'.repeat(2001), source: 'manual', confidence: 0 }]) {
    assert.equal((await post(input)).status, 400);
  }
  assert.equal((await fetch(base + '/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await fetch(base + '/api/match', { method: 'POST', body: '약국' })).status, 415);
  assert.equal((await post({ text: 'a'.repeat(17000), source: 'manual', confidence: 0 })).status, 413);
  assert.equal((await discover({ text: '', language: 'ko' })).status, 400);
  assert.equal((await discover({ text: '간판', language: 'xx' })).status, 400);
  assert.equal((await fetch(base + '/api/health')).status, 200);
});

test('database/source files, traversal, cross-origin writes and unexpected methods are blocked', async () => {
  for (const url of ['/data/signs.sqlite', '/data/seed.json', '/server.mjs', '/package.json', '/assets/%2e%2e%2fdata%2fsigns.sqlite', '/vendor/core/%2e%2e%2f%2e%2e%2fpackage.json']) {
    assert.equal((await fetch(base + url)).status, 404, url);
  }
  for (const origin of ['https://other.example', 'null', 'malformed']) {
    assert.equal((await post({ text: '약국', source: 'manual', confidence: 0 }, { Origin: origin })).status, 403);
    assert.equal((await discover({ text: '빽다방', language: 'ko' }, { Origin: origin })).status, 403);
    assert.equal((await contribute({ storeName: '거부', category: 'cafe', consent: true, clientId: 'client-cross-origin' }, { Origin: origin })).status, 403);
  }
  const preflight = await fetch(base + '/api/community', { method: 'OPTIONS', headers: { Origin: 'http://localhost', 'Access-Control-Request-Method': 'GET' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost');
  assert.equal((await fetch(base + '/api/catalog', { method: 'DELETE' })).status, 405);
});
