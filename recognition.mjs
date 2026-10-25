import { matchEntries } from './recognition-core.mjs';

// Text matching is deliberately distinct from recognizing a particular store or image.
export function matchText(db, { text, confidence = 0, source = 'ocr' }) {
  const entries = db.prepare(`SELECT aliases.*, signs.brand_id, subcategories.category_id FROM aliases JOIN signs ON signs.id = aliases.sign_id JOIN subcategories ON subcategories.id = signs.subcategory_id`).all().map(alias => ({
    signId: alias.sign_id,
    text: alias.text,
    normalized: alias.normalized,
    brandId: alias.brand_id,
    categoryId: alias.category_id
  }));
  return matchEntries(entries, { text, confidence, source });
}
