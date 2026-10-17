import { normalize } from './database.mjs';

function similarity(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}

// Text matching is deliberately distinct from recognizing a particular store or image.
export function matchText(db, { text, confidence = 0, source = 'ocr' }) {
  const pieces = [...new Set(text.split(/[\n\r\t|,;:]+/).flatMap(line => [normalize(line), ...line.split(/\s+/).map(normalize)]).filter(Boolean))];
  const rows = db.prepare(`SELECT aliases.*, signs.brand_id, subcategories.category_id FROM aliases JOIN signs ON signs.id = aliases.sign_id JOIN subcategories ON subcategories.id = signs.subcategory_id`).all();
  const bySign = new Map();
  for (const alias of rows) {
    let score = 0, kind = 'similar';
    if (pieces.includes(alias.normalized)) { score = 1; kind = 'exact'; }
    else for (const piece of pieces) {
      // A longer store name ending with an industry word is only a candidate.
      if (!alias.brand_id && alias.normalized.length >= 2 && piece.endsWith(alias.normalized) && piece.length > alias.normalized.length) score = Math.max(score, .8);
      if (Math.min(piece.length, alias.normalized.length) >= 4) score = Math.max(score, similarity(piece, alias.normalized));
    }
    if (score < .72) continue;
    const existing = bySign.get(alias.sign_id);
    if (!existing || score > existing.score) bySign.set(alias.sign_id, { id: alias.sign_id, alias: alias.text, kind, score, category: alias.category_id, scope: alias.brand_id ? 'brand' : 'type' });
  }
  let candidates = [...bySign.values()].sort((a, b) => b.score - a.score || Number(b.scope === 'brand') - Number(a.scope === 'brand') || a.id.localeCompare(b.id));
  const exactBrands = candidates.filter(c => c.kind === 'exact' && c.scope === 'brand');
  if (exactBrands.length) candidates = candidates.filter(c => c.scope === 'brand' || !exactBrands.some(b => b.category === c.category));
  const exact = candidates.filter(c => c.kind === 'exact');
  const reliable = source === 'manual' || confidence >= 75;
  const status = !candidates.length ? 'no_match' : exact.length > 1 ? 'ambiguous' : exact.length === 1 && reliable ? 'matched' : 'candidates';
  return { status, matchedId: status === 'matched' ? exact[0].id : null, candidates: candidates.slice(0, 5), scope: status === 'matched' ? exact[0].scope : null, requiresConfirmation: status !== 'matched' && candidates.length > 0 };
}
