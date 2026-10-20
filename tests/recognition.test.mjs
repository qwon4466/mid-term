import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { openDatabase, getCatalog, seedDatabase, normalize, root } from '../database.mjs';
import { matchText } from '../recognition.mjs';

const db = openDatabase(':memory:');
after(() => db.close());
const match = (text, extra = {}) => matchText(db, { text, source: 'manual', confidence: 0, ...extra });

test('catalog has four categories and twelve complete subcategories', () => {
  const catalog = getCatalog(db);
  assert.deepEqual(catalog.categories.map(c => c.id), ['medical', 'cafe', 'transport', 'restaurant']);
  assert.equal(catalog.subcategories.length, 12);
  assert.equal(catalog.cards.length, 12);
  assert.equal(new Set(catalog.cards.map(c => c.subcategory)).size, 12);
  for (const c of catalog.cards) {
    for (const lang of ['ko', 'en', 'ja']) {
      assert.ok(c.translations[lang].meaning);
      assert.ok(c.translations[lang].explanation);
      assert.ok(c.translations[lang].keywords.length);
      assert.ok(c.travelGuide.experience[lang]);
    }
    assert.ok(c.travelGuide.phrases.length >= 2);
    for (const phrase of c.travelGuide.phrases) {
      assert.ok(phrase.korean);
      assert.ok(phrase.romanization);
      for (const lang of ['ko', 'en', 'ja']) assert.ok(phrase.meaning[lang]);
    }
    assert.equal(c.images.filter(i => i.role === 'primary').length, 1);
    for (const image of c.images) {
      assert.ok(existsSync(path.join(root, image.path)), image.path);
      if (image.kind === 'photo') {
        assert.match(image.license, /^CC BY/);
        assert.match(image.sourceUrl, /^https:/);
        assert.match(image.licenseUrl, /^https:/);
        assert.ok(image.author);
      }
    }
    assert.ok(existsSync(path.join(root, c.portrait)), c.portrait);
  }
  assert.equal(catalog.cards.flatMap(c => c.images).length, 14);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

test('re-seeding is idempotent', () => {
  const before = getCatalog(db);
  seedDatabase(db);
  assert.deepEqual(getCatalog(db), before);
});

test('normalization handles punctuation, spaces and fullwidth Latin', () => {
  assert.equal(normalize('ＭＥＧＡ ＭＧＣ Coffee!'), 'megamgccoffee');
  assert.equal(normalize('메가 MGC 커피'), '메가mgc커피');
});

for (const [text, id, scope] of [
  ['약국', 'pharmacy', 'type'], ['W병원', 'hospital', 'type'],
  ['메가커피', 'mega', 'brand'], ['스타벅스 커피', 'starbucks', 'brand'],
  ['커피숍', 'cafe', 'type'], ['지하철', 'subway', 'type'],
  ['버스정류장', 'bus', 'type'], ['택시 승강장', 'taxi', 'type'],
  ['한식', 'korean', 'type'], ['중식', 'chinese', 'type'],
  ['일식', 'japanese', 'type'], ['롯데리아', 'lotteria', 'brand']
]) test(`exact phrase: ${text}`, () => {
  const result = match(text);
  assert.equal(result.status, 'matched');
  assert.equal(result.matchedId, id);
  assert.equal(result.scope, scope);
});

test('reliable OCR may match exact text, low-confidence OCR must ask', () => {
  assert.equal(match('스타벅스', { source: 'ocr', confidence: 92 }).matchedId, 'starbucks');
  const result = match('스타벅스', { source: 'ocr', confidence: 60 });
  assert.equal(result.status, 'candidates');
  assert.equal(result.matchedId, null);
  assert.equal(result.requiresConfirmation, true);
});

test('conflicting sign types are not resolved automatically', () => {
  const result = match('약국\n병원');
  assert.equal(result.status, 'ambiguous');
  assert.equal(result.matchedId, null);
  assert.equal(result.candidates.length, 2);
});

test('exact brand takes precedence over generic cafe label', () => {
  const result = match('메가커피\n커피숍');
  assert.equal(result.matchedId, 'mega');
  assert.equal(result.candidates.some(c => c.id === 'cafe'), false);
});

test('longer store names and spelling errors are only candidates', () => {
  for (const text of ['행복약국', '스타벅쓰']) {
    const result = match(text);
    assert.equal(result.status, 'candidates');
    assert.equal(result.matchedId, null);
    assert.equal(result.requiresConfirmation, true);
  }
});

test('unknown text, other businesses and SQL text never become exact matches', () => {
  for (const text of ['슈퍼마켓', '세탁소', "' OR 1=1 --", '']) {
    const result = match(text);
    assert.equal(result.status, 'no_match');
    assert.equal(result.matchedId, null);
  }
  assert.equal(getCatalog(db).cards.length, 12);
});
