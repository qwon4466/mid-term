import { createHash, randomUUID } from 'node:crypto';
import { getCatalog, normalize } from './database.mjs';

const CLIENT_PATTERN = /^[a-zA-Z0-9._:-]{8,120}$/;
const PUBLIC_THRESHOLD = 2;

function clientHash(clientId) {
  if (typeof clientId !== 'string' || !CLIENT_PATTERN.test(clientId)) throw new TypeError('A valid anonymous client id is required.');
  return createHash('sha256').update(`${process.env.COMMUNITY_HASH_PEPPER || 'sign-by-sign-local'}:${clientId}`).digest('hex');
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function voteCounts(db, id) {
  const rows = db.prepare('SELECT value, count(*) count FROM community_votes WHERE contribution_id = ? GROUP BY value').all(id);
  const counts = { confirm: 0, reject: 0 };
  rows.forEach(row => { counts[row.value] = Number(row.count); });
  return counts;
}

function publicRow(db, row) {
  const votes = voteCounts(db, row.id);
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storeName: row.store_name,
    ocrText: row.ocr_text,
    category: row.category_id,
    subcategory: row.subcategory_id,
    description: row.description,
    status: row.status,
    confirmations: votes.confirm,
    rejections: votes.reject,
    requiredConfirmations: PUBLIC_THRESHOLD,
    hasPhoto: Boolean(row.photo_data),
    photoConsent: Boolean(row.photo_consent)
  };
}

export function createContribution(db, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid contribution.');
  const storeName = clean(input.storeName, 120);
  const category = clean(input.category, 80);
  const subcategory = clean(input.subcategory, 80);
  const description = clean(input.description, 800);
  const ocrText = clean(input.ocrText, 500);
  const consent = input.consent === true;
  const submitter = clientHash(input.clientId);
  if (!storeName || !category || !subcategory || !consent || !db.prepare('SELECT 1 ok FROM subcategories WHERE id = ? AND category_id = ?').get(subcategory, category)) throw new TypeError('Name, category, subcategory and consent are required.');
  const photoConsent = input.photoConsent === true;
  let photoData = photoConsent ? clean(input.photoData, 600000) : '';
  if (photoData && !/^data:image\/jpeg;base64,[a-zA-Z0-9+/=]+$/.test(photoData)) photoData = '';
  const normalizedName = normalize(storeName);
  const now = Date.now();
  let id;
  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db.prepare("SELECT * FROM community_contributions WHERE normalized_name = ? AND subcategory_id = ? AND status IN ('pending','published') ORDER BY created_at LIMIT 1").get(normalizedName, subcategory);
    if (existing) {
      db.prepare(`INSERT INTO community_votes (contribution_id,voter_hash,value,created_at) VALUES (?,?,?,?)
        ON CONFLICT(contribution_id,voter_hash) DO UPDATE SET value='confirm', created_at=excluded.created_at`).run(existing.id, submitter, 'confirm', now);
      const counts = voteCounts(db, existing.id);
      const status = counts.confirm >= PUBLIC_THRESHOLD && counts.confirm > counts.reject ? 'published' : existing.status;
      db.prepare("UPDATE community_contributions SET updated_at=?, status=?, published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END, photo_data=CASE WHEN photo_data='' THEN ? ELSE photo_data END, photo_consent=CASE WHEN photo_data='' AND ?<>'' THEN 1 ELSE photo_consent END WHERE id=?")
        .run(now, status, status, now, photoData, photoData, existing.id);
      db.exec('COMMIT');
      return { ...publicRow(db, db.prepare('SELECT * FROM community_contributions WHERE id = ?').get(existing.id)), deduplicated: true };
    }
    id = randomUUID();
    db.prepare(`INSERT INTO community_contributions
      (id,created_at,updated_at,store_name,normalized_name,ocr_text,category_id,subcategory_id,description,photo_data,photo_consent,submitter_hash,status,published_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)`).run(id, now, now, storeName, normalizedName, ocrText, category, subcategory, description, photoData, photoConsent ? 1 : 0, submitter, 'pending');
    db.prepare('INSERT INTO community_votes (contribution_id,voter_hash,value,created_at) VALUES (?,?,?,?)').run(id, submitter, 'confirm', now);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return publicRow(db, db.prepare('SELECT * FROM community_contributions WHERE id = ?').get(id));
}

export function voteContribution(db, id, input) {
  if (!/^[0-9a-f-]{36}$/.test(String(id || '')) || !input || !['confirm', 'reject'].includes(input.vote)) throw new TypeError('Invalid community vote.');
  const voter = clientHash(input.clientId);
  const row = db.prepare('SELECT * FROM community_contributions WHERE id = ?').get(id);
  if (!row) return null;
  if (row.status !== 'pending') return publicRow(db, row);
  const now = Date.now();
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`INSERT INTO community_votes (contribution_id,voter_hash,value,created_at) VALUES (?,?,?,?)
      ON CONFLICT(contribution_id,voter_hash) DO UPDATE SET value=excluded.value, created_at=excluded.created_at`).run(id, voter, input.vote, now);
    const counts = voteCounts(db, id);
    const status = counts.confirm >= PUBLIC_THRESHOLD && counts.confirm > counts.reject ? 'published' : 'pending';
    db.prepare('UPDATE community_contributions SET status=?, updated_at=?, published_at=CASE WHEN ? = \'published\' THEN COALESCE(published_at,?) ELSE published_at END WHERE id=?').run(status, now, status, now, id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return publicRow(db, db.prepare('SELECT * FROM community_contributions WHERE id = ?').get(id));
}

function communityCard(db, row) {
  const catalog = getCatalog(db);
  const template = catalog.cards.find(card => card.subcategory === row.subcategory_id && card.imageKind === 'illustration') || catalog.cards.find(card => card.subcategory === row.subcategory_id) || catalog.cards.find(card => card.category === row.category_id) || catalog.cards[0];
  const category = catalog.categories.find(item => item.id === row.category_id);
  const label = category?.label || { ko: '가게·장소', en: 'store or place', ja: '店舗・場所' };
  const baseImage = template.images.find(image => image.role === 'primary') || template.images[0];
  const aliases = [...new Set([row.store_name, ...row.ocr_text.split(/[\n\r|,;:]+/).map(value => value.trim())].filter(Boolean))].slice(0, 8);
  const koMeaning = row.description || `${row.store_name}에 대해 사용자가 공유한 간판 정보입니다.`;
  const translations = {
    ko: { meaning: koMeaning, explanation: `여러 사용자의 확인을 거쳐 ${label.ko} 카테고리에 공개된 정보입니다.`, keywords: [row.store_name, label.ko] },
    en: { meaning: `Community information for ${row.store_name}.`, explanation: `Verified by multiple users and published in the ${label.en} category.`, keywords: [row.store_name, label.en] },
    ja: { meaning: `${row.store_name}について利用者が共有した看板情報です。`, explanation: `複数の利用者が確認し、${label.ja}カテゴリーで公開された情報です。`, keywords: [row.store_name, label.ja] }
  };
  const imagePath = baseImage.path;
  const portraitPath = baseImage.portrait || imagePath;
  const image = {
    id: `community-${row.id}-primary`, path: imagePath, portrait: portraitPath, role: 'primary', kind: 'illustration',
    author: 'Sign by Sign community', license: 'Category representative image', sourceUrl: '', licenseUrl: '',
    changes: 'A category representative image is shown; the submitted review photo is not published.'
  };
  return {
    id: `community-${row.id}`, category: row.category_id, subcategory: row.subcategory_id || template.subcategory, brand: null, brandName: row.store_name,
    korean: row.store_name, difficulty: 1, image: imagePath, portrait: portraitPath, imageKind: 'illustration', images: [image], translations,
    travelGuide: template.travelGuide, aliases, ...translations.en,
    community: { contributionId: row.id, confirmations: voteCounts(db, row.id).confirm, publishedAt: row.published_at }
  };
}

export function getCommunityCatalog(db) {
  const pendingRows = db.prepare("SELECT * FROM community_contributions WHERE status = 'pending' ORDER BY created_at DESC LIMIT 50").all();
  const publishedRows = db.prepare("SELECT * FROM community_contributions WHERE status = 'published' ORDER BY published_at DESC LIMIT 200").all();
  const updatedAt = db.prepare('SELECT max(updated_at) value FROM community_contributions').get()?.value || 0;
  return {
    version: 1 + publishedRows.length,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
    requiredConfirmations: PUBLIC_THRESHOLD,
    pending: pendingRows.map(row => publicRow(db, row)),
    cards: publishedRows.map(row => communityCard(db, row))
  };
}

export function matchCommunity(db, input) {
  const pieces = [...new Set(String(input.text || '').split(/[\n\r\t|,;:]+/).flatMap(value => [normalize(value), ...value.split(/\s+/).map(normalize)]).filter(Boolean))];
  if (!pieces.length) return null;
  const rows = db.prepare("SELECT * FROM community_contributions WHERE status = 'published'").all();
  const matches = rows.filter(row => pieces.includes(row.normalized_name) || row.ocr_text.split(/[\n\r|,;:]+/).map(normalize).some(alias => pieces.includes(alias)));
  if (!matches.length) return null;
  const candidates = matches.map(row => ({ id: `community-${row.id}`, alias: row.store_name, kind: 'exact', score: 1, category: row.category_id, subcategory: row.subcategory_id, scope: 'community' }));
  if (candidates.length > 1) return { status: 'ambiguous', matchedId: null, candidates, scope: null, requiresConfirmation: true, community: true };
  const reliable = input.source === 'manual' || Number(input.confidence) >= 75;
  return { status: reliable ? 'matched' : 'candidates', matchedId: reliable ? candidates[0].id : null, candidates, scope: reliable ? 'community' : null, requiresConfirmation: !reliable, community: true };
}
