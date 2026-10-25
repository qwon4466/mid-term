import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('./', import.meta.url));
export function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu, '');
}

export function openDatabase(filename = path.join(root, 'data/signs.sqlite')) {
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, labels TEXT NOT NULL, description TEXT NOT NULL, cover TEXT NOT NULL, icon TEXT NOT NULL, sort_order INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS subcategories (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), labels TEXT NOT NULL, sort_order INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS brands (id TEXT PRIMARY KEY, name TEXT NOT NULL, homepage TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS signs (id TEXT PRIMARY KEY, subcategory_id TEXT NOT NULL REFERENCES subcategories(id), brand_id TEXT REFERENCES brands(id), korean TEXT NOT NULL, difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 3));
    CREATE TABLE IF NOT EXISTS translations (sign_id TEXT NOT NULL REFERENCES signs(id), language TEXT NOT NULL CHECK(language IN ('ko','en','ja')), meaning TEXT NOT NULL, explanation TEXT NOT NULL, keywords TEXT NOT NULL, PRIMARY KEY(sign_id, language));
    CREATE TABLE IF NOT EXISTS travel_guides (sign_id TEXT PRIMARY KEY REFERENCES signs(id), experience TEXT NOT NULL, phrases TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS aliases (sign_id TEXT NOT NULL REFERENCES signs(id), text TEXT NOT NULL, normalized TEXT NOT NULL, PRIMARY KEY(sign_id, normalized));
    CREATE INDEX IF NOT EXISTS aliases_lookup ON aliases(normalized);
    CREATE TABLE IF NOT EXISTS images (id TEXT PRIMARY KEY, sign_id TEXT NOT NULL REFERENCES signs(id), path TEXT NOT NULL, portrait_path TEXT, role TEXT NOT NULL CHECK(role IN ('primary','context')), kind TEXT NOT NULL CHECK(kind IN ('photo','illustration')), metadata TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS one_primary_image ON images(sign_id) WHERE role = 'primary';
    CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS community_contributions (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      store_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      ocr_text TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      description TEXT NOT NULL,
      photo_data TEXT NOT NULL DEFAULT '',
      submitter_hash TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending','published','rejected')),
      published_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS community_status_created ON community_contributions(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS community_normalized_name ON community_contributions(normalized_name);
    CREATE TABLE IF NOT EXISTS community_votes (
      contribution_id TEXT NOT NULL REFERENCES community_contributions(id) ON DELETE CASCADE,
      voter_hash TEXT NOT NULL,
      value TEXT NOT NULL CHECK(value IN ('confirm','reject')),
      created_at INTEGER NOT NULL,
      PRIMARY KEY(contribution_id, voter_hash)
    );
    CREATE TABLE IF NOT EXISTS support_requests (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('report','inquiry')),
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      client_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed'))
    );
    CREATE INDEX IF NOT EXISTS support_created ON support_requests(created_at DESC);`);
  const contributionColumns = new Set(db.prepare('PRAGMA table_info(community_contributions)').all().map(column => column.name));
  if (!contributionColumns.has('subcategory_id')) db.exec('ALTER TABLE community_contributions ADD COLUMN subcategory_id TEXT');
  if (!contributionColumns.has('photo_consent')) db.exec('ALTER TABLE community_contributions ADD COLUMN photo_consent INTEGER NOT NULL DEFAULT 0');
  const signCount = db.prepare('SELECT count(*) n FROM signs').get().n;
  const seedVersion = String(JSON.parse(readFileSync(path.join(root, 'data/seed.json'), 'utf8')).version || 1);
  const installedVersion = db.prepare("SELECT value FROM app_meta WHERE key = 'seed_version'").get()?.value;
  if (!signCount || installedVersion !== seedVersion) seedDatabase(db);
  return db;
}

export function seedDatabase(db) {
  const seed = JSON.parse(readFileSync(path.join(root, 'data/seed.json'), 'utf8'));
  const travelGuides = JSON.parse(readFileSync(path.join(root, 'data/travel-guides.json'), 'utf8')).guides;
  const photos = JSON.parse(readFileSync(path.join(root, 'data/photo-sources.json'), 'utf8'));
  const put = (table, values) => {
    const keys = Object.keys(values);
    db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON CONFLICT DO UPDATE SET ${keys.map(k => `${k}=excluded.${k}`).join(',')}`).run(...Object.values(values));
  };
  const photo = id => {
    const item = photos.find(p => p.id === id);
    if (!item) throw new Error(`Photo metadata missing: ${id}`);
    return item;
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    seed.categories.forEach((c, i) => put('categories', { id: c.id, labels: JSON.stringify(c.label), description: JSON.stringify(c.description), cover: c.cover, icon: c.icon, sort_order: i }));
    seed.subcategories.forEach((s, i) => put('subcategories', { id: s.id, category_id: s.category, labels: JSON.stringify(s.label), sort_order: i }));
    seed.brands.forEach(b => put('brands', b));
    seed.signs.forEach(s => {
      put('signs', { id: s.id, subcategory_id: s.subcategory, brand_id: s.brand, korean: s.korean, difficulty: s.difficulty });
      for (const [language, tr] of Object.entries(s.translations)) put('translations', { sign_id: s.id, language, meaning: tr.meaning, explanation: tr.explanation, keywords: JSON.stringify(tr.keywords) });
      db.prepare('DELETE FROM aliases WHERE sign_id = ?').run(s.id);
      [...new Set(s.aliases)].forEach(text => db.prepare('INSERT OR IGNORE INTO aliases VALUES (?,?,?)').run(s.id, text, normalize(text)));
      const illustration = item => ({ path: item.path || `assets/ax/generated/${item.generated}.png`, kind: 'illustration', author: 'Sign by Sign · OpenAI image generation', license: 'AI-generated educational example', sourceUrl: '', licenseUrl: '', changes: 'Original fictional learning image; no claim of an actual branch.', promptReference: 'data/generation-prompts.md' });
      let configured = s.images;
      if (!configured) configured = [s.photo ? { photo: s.photo } : (s.generated ? { generated: s.generated } : { path: s.image, portrait: s.portrait })].concat(s.context ? [{ photo: s.context }] : []);
      const resolved = configured.map(item => item.photo ? photo(item.photo) : illustration(item));
      const unique = resolved.filter((item, index, list) => list.findIndex(other => other.path === item.path) === index);
      db.prepare('DELETE FROM images WHERE sign_id = ?').run(s.id);
      unique.forEach((item, index) => put('images', { id: `${s.id}-${index === 0 ? 'primary' : `context-${index}`}`, sign_id: s.id, path: item.path, portrait_path: configured[index]?.portrait || null, role: index === 0 ? 'primary' : 'context', kind: item.kind, metadata: JSON.stringify(item) }));
    });
    travelGuides.forEach(guide => put('travel_guides', { sign_id: guide.sign, experience: JSON.stringify(guide.experience), phrases: JSON.stringify(guide.phrases) }));
    put('app_meta', { key: 'seed_version', value: String(seed.version || 1) });
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export function getCatalog(db) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all().map(c => ({ id: c.id, label: JSON.parse(c.labels), description: JSON.parse(c.description), cover: c.cover, icon: c.icon }));
  const subcategories = db.prepare('SELECT * FROM subcategories ORDER BY sort_order').all().map(s => ({ id: s.id, category: s.category_id, label: JSON.parse(s.labels) }));
  const cards = db.prepare(`SELECT signs.*, subcategories.category_id, brands.name brand_name FROM signs JOIN subcategories ON subcategories.id = signs.subcategory_id LEFT JOIN brands ON brands.id = signs.brand_id ORDER BY subcategories.sort_order, signs.id`).all().map(s => {
    const images = db.prepare('SELECT * FROM images WHERE sign_id = ? ORDER BY role DESC').all(s.id).map(i => ({ id: i.id, path: i.path, portrait: i.portrait_path, role: i.role, kind: i.kind, ...JSON.parse(i.metadata) }));
    const primary = images.find(i => i.role === 'primary');
    const translations = Object.fromEntries(db.prepare('SELECT * FROM translations WHERE sign_id = ?').all(s.id).map(tr => [tr.language, { meaning: tr.meaning, explanation: tr.explanation, keywords: JSON.parse(tr.keywords) }]));
    const guideRow = db.prepare('SELECT * FROM travel_guides WHERE sign_id = ?').get(s.id) || db.prepare(`SELECT travel_guides.* FROM travel_guides
      JOIN signs ON signs.id = travel_guides.sign_id JOIN subcategories ON subcategories.id = signs.subcategory_id
      WHERE subcategories.category_id = ? ORDER BY subcategories.sort_order LIMIT 1`).get(s.category_id);
    const travelGuide = guideRow ? { experience: JSON.parse(guideRow.experience), phrases: JSON.parse(guideRow.phrases) } : { experience: {}, phrases: [] };
    return { id: s.id, category: s.category_id, subcategory: s.subcategory_id, brand: s.brand_id, brandName: s.brand_name, korean: s.korean, difficulty: s.difficulty,
      image: primary.path, portrait: primary.portrait || primary.path, imageKind: primary.kind, images, translations, travelGuide, aliases: db.prepare('SELECT text FROM aliases WHERE sign_id = ?').all(s.id).map(a => a.text), ...translations.en };
  });
  return { version: 3, categories, subcategories, cards };
}

if (process.argv.includes('--seed')) {
  const db = openDatabase();
  seedDatabase(db);
  const catalog = getCatalog(db);
  console.log(`SQLite ready: ${catalog.categories.length} categories, ${catalog.subcategories.length} subcategories, ${catalog.cards.length} signs.`);
  db.close();
}
