import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverSign, providerStatus } from '../discovery.mjs';

test('common unregistered brands receive useful guidance without API credentials', async () => {
  const result = await discoverSign({ text: '빽다방', language: 'ko' }, {});
  assert.equal(result.status, 'guided');
  assert.equal(result.name, '빽다방');
  assert.equal(result.category, 'cafe');
  assert.match(result.description, /카페/);
  assert.ok(result.phrases.length >= 2);
  assert.equal(result.searched, false);
  assert.deepEqual(providerStatus({}), { naver: false, google: false });
});

test('beer-pub brands explain the business and useful phrases without API credentials', async () => {
  for (const [input, canonical] of [['역전할머니맥주', '역전할머니맥주'], ['인생맥주', '인쌩맥주']]) {
    const result = await discoverSign({ text: input, language: 'ko' }, {});
    assert.equal(result.status, 'guided');
    assert.equal(result.name, canonical);
    assert.equal(result.category, 'bar');
    assert.match(result.categoryLabel, /주점/);
    assert.match(result.description, /맥주/);
    assert.ok(result.phrases.some(phrase => phrase.korean.includes('생맥주')));
    assert.equal(result.sources.length, 2);
  }
});

test('discovery guidance is localized when the display language changes', async () => {
  const english = await discoverSign({ text: '인쌩맥주', language: 'en' }, {});
  assert.equal(english.categoryLabel, 'Beer pub or bar');
  assert.match(english.description, /pub serving beer/i);
  assert.match(english.experience, /order drinks/i);
  assert.match(english.disclaimer, /Confirm the exact branch/i);

  const japanese = await discoverSign({ text: '인쌩맥주', language: 'ja' }, {});
  assert.equal(japanese.categoryLabel, 'ビアパブ・居酒屋');
  assert.match(japanese.description, /ビール/);
  assert.match(japanese.experience, /お酒と料理/);
  assert.match(japanese.disclaimer, /正確な店舗/);
});

test('completely unknown signs still return universal phrases and map searches', async () => {
  const result = await discoverSign({ text: '새로운상점123', language: 'ko' }, {});
  assert.equal(result.status, 'guidance');
  assert.equal(result.category, 'unknown');
  assert.ok(result.phrases.some(phrase => phrase.korean.includes('뭐 하는 곳')));
  assert.equal(result.sources.length, 2);
  assert.ok(result.sources.every(source => source.url.startsWith('https://')));
});

test('Naver local evidence upgrades a sign to searched guidance', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({ items: [{ title: '<b>새봄약국</b>', category: '생활,편의>약국', roadAddress: '서울시 테스트로 1', link: '' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const result = await discoverSign(
    { text: '새봄약국', language: 'ko' },
    { NAVER_SEARCH_CLIENT_ID: 'id', NAVER_SEARCH_CLIENT_SECRET: 'secret' },
    fakeFetch
  );
  assert.equal(result.status, 'discovered');
  assert.equal(result.category, 'pharmacy');
  assert.equal(result.sources[0].provider, 'naver');
  assert.equal(result.sources[0].name, '새봄약국');
  assert.equal(result.searched, true);
});
