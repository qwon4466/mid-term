import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getCatalog, openDatabase, root } from '../database.mjs';
import { matchText } from '../recognition.mjs';
import { chooseAdaptiveMatch, matchCatalog, suggestCategory } from '../recognition-core.mjs';

test('mobile matcher preserves the server verdict for typical and uncertain signs', () => {
  const db = openDatabase(':memory:');
  try {
    const cards = getCatalog(db).cards;
    for (const text of ['약국', 'W병원', '메가커피', '스타벅스 커피', '커피숍', '지하철', '버스정류장', '택시 승강장', '한식', '중식', '일식', '롯데리아', '약국\n병원', '스타벅쓰', '슈퍼마켓']) {
      for (const confidence of [40, 90]) {
        const input = { text, confidence, source: 'ocr' };
        assert.deepEqual(matchCatalog(cards, input), matchText(db, input), `${text} at ${confidence}`);
      }
    }
  } finally {
    db.close();
  }
});

test('adaptive feedback cannot replace an exact or conflicting catalog result', () => {
  const db = openDatabase(':memory:');
  const cards = getCatalog(db).cards;
  db.close();
  const learned = { status: 'matched', matchedId: 'pharmacy', candidates: [{ id: 'pharmacy' }] };
  for (const text of ['메가커피', '약국\n병원']) {
    const base = matchCatalog(cards, { text, confidence: 90, source: 'ocr' });
    assert.equal(chooseAdaptiveMatch(base, learned), base);
  }
  const sameCandidate = matchCatalog(cards, { text: '행복약국', confidence: 90, source: 'ocr' });
  assert.equal(chooseAdaptiveMatch(sameCandidate, learned), learned);
});

test('unregistered text produces only a category suggestion, not a confirmed shop', () => {
  const db = openDatabase(':memory:');
  try {
    const cards = getCatalog(db).cards;
    const result = matchCatalog(cards, { text: '처음보는 약국', confidence: 20, source: 'ocr' });
    assert.equal(result.matchedId, null);
    assert.equal(suggestCategory(cards, '처음보는 약국')?.id, 'medical');
  } finally {
    db.close();
  }
});

test('mobile bundle contains its offline catalog and OCR resources', t => {
  const web = path.join(root, 'www');
  if (!existsSync(path.join(web, 'data/catalog.json'))) return t.skip('Run npm run build:mobile to inspect generated assets');
  const catalog = JSON.parse(readFileSync(path.join(web, 'data/catalog.json'), 'utf8'));
  assert.equal(catalog.cards.length, 12);
  for (const file of ['native-bridge.js', 'ax.js', 'ax.css', 'vendor/tesseract/tesseract.min.js', 'vendor/tesseract/worker.min.js', 'ocr-data/kor.traineddata', 'ocr-data/eng.traineddata']) {
    assert.ok(existsSync(path.join(web, file)), file);
  }
});
