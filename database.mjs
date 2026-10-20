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
    CREATE UNIQUE INDEX IF NOT EXISTS one_primary_image ON images(sign_id) WHERE role = 'primary';`);
  const signCount = db.prepare('SELECT count(*) n FROM signs').get().n;
  const guideCount = db.prepare('SELECT count(*) n FROM travel_guides').get().n;
  if (!signCount || guideCount !== signCount) seedDatabase(db);
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
      let primary;
      if (s.photo) primary = photo(s.photo);
      else primary = { path: s.image || `assets/ax/generated/${s.generated}.png`, kind: 'illustration', author: 'Sign by Sign · OpenAI image generation', license: 'AI-generated educational example', sourceUrl: '', licenseUrl: '', changes: 'Original illustration; no claim of an actual branch.', promptReference: s.generated ? 'data/generation-prompts.md' : 'prototype.html original image asset' };
      put('images', { id: `${s.id}-primary`, sign_id: s.id, path: primary.path, portrait_path: s.portrait || null, role: 'primary', kind: primary.kind, metadata: JSON.stringify(primary) });
      if (s.context) {
        const context = photo(s.context);
        put('images', { id: `${s.id}-context`, sign_id: s.id, path: context.path, portrait_path: null, role: 'context', kind: 'photo', metadata: JSON.stringify(context) });
      }
    });
    travelGuides.forEach(guide => put('travel_guides', { sign_id: guide.sign, experience: JSON.stringify(guide.experience), phrases: JSON.stringify(guide.phrases) }));
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
    const guideRow = db.prepare('SELECT * FROM travel_guides WHERE sign_id = ?').get(s.id);
    const travelGuide = guideRow ? { experience: JSON.parse(guideRow.experience), phrases: JSON.parse(guideRow.phrases) } : { experience: {}, phrases: [] };
    return { id: s.id, category: s.category_id, subcategory: s.subcategory_id, brand: s.brand_id, brandName: s.brand_name, korean: s.korean, difficulty: s.difficulty,
      image: primary.path, portrait: primary.portrait || primary.path, imageKind: primary.kind, images, translations, travelGuide, aliases: db.prepare('SELECT text FROM aliases WHERE sign_id = ?').all(s.id).map(a => a.text), ...translations.en };
  });
  return { version: 2, categories, subcategories, cards };
}

if (process.argv.includes('--seed')) {
  const db = openDatabase();
  seedDatabase(db);
  const catalog = getCatalog(db);
  console.log(`SQLite ready: ${catalog.categories.length} categories, ${catalog.subcategories.length} subcategories, ${catalog.cards.length} signs.`);
  db.close();
}
