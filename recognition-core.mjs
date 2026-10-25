export function normalizeText(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu, '');
}

export function similarity(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}

export function recognizedPieces(text) {
  return [...new Set(String(text || '').split(/[\n\r\t|,;:]+/)
    .flatMap(line => [normalizeText(line), ...line.split(/\s+/).map(normalizeText)])
    .filter(Boolean))];
}

export function matchEntries(entries, { text, confidence = 0, source = 'ocr' }) {
  const pieces = recognizedPieces(text);
  const bySign = new Map();
  for (const alias of entries) {
    let score = 0;
    let kind = 'similar';
    if (pieces.includes(alias.normalized)) {
      score = 1;
      kind = 'exact';
    } else {
      for (const piece of pieces) {
        if (!alias.brandId && alias.normalized.length >= 2 && piece.endsWith(alias.normalized) && piece.length > alias.normalized.length) {
          score = Math.max(score, 0.8);
        }
        if (Math.min(piece.length, alias.normalized.length) >= 4) score = Math.max(score, similarity(piece, alias.normalized));
      }
    }
    if (score < 0.72) continue;
    const candidate = { id: alias.signId, alias: alias.text, kind, score, category: alias.categoryId, scope: alias.brandId ? 'brand' : 'type' };
    const existing = bySign.get(alias.signId);
    if (!existing || score > existing.score) bySign.set(alias.signId, candidate);
  }

  let candidates = [...bySign.values()].sort((a, b) => b.score - a.score || Number(b.scope === 'brand') - Number(a.scope === 'brand') || a.id.localeCompare(b.id));
  const exactBrands = candidates.filter(candidate => candidate.kind === 'exact' && candidate.scope === 'brand');
  if (exactBrands.length) candidates = candidates.filter(candidate => candidate.scope === 'brand' || !exactBrands.some(brand => brand.category === candidate.category));
  const exact = candidates.filter(candidate => candidate.kind === 'exact');
  const reliable = source === 'manual' || confidence >= 75;
  const status = !candidates.length ? 'no_match' : exact.length > 1 ? 'ambiguous' : exact.length === 1 && reliable ? 'matched' : 'candidates';
  return {
    status,
    matchedId: status === 'matched' ? exact[0].id : null,
    candidates: candidates.slice(0, 5),
    scope: status === 'matched' ? exact[0].scope : null,
    requiresConfirmation: status !== 'matched' && candidates.length > 0
  };
}

export function entriesFromCatalog(cards) {
  return cards.flatMap(card => (card.aliases || []).map(text => ({
    signId: card.id,
    text,
    normalized: normalizeText(text),
    brandId: card.brand || null,
    categoryId: card.category
  })));
}

export function matchCatalog(cards, input) {
  return matchEntries(entriesFromCatalog(cards), input);
}

export function chooseAdaptiveMatch(base, learned) {
  if (!learned || base.status === 'matched' || base.status === 'ambiguous') return base;
  if (base.candidates.some(candidate => candidate.id !== learned.candidates[0]?.id)) return base;
  return learned;
}

export function suggestCategory(cards, text) {
  const pieces = recognizedPieces(text);
  if (!pieces.length) return null;
  const scores = new Map();
  for (const card of cards) {
    const terms = [card.korean, ...(card.aliases || [])];
    for (const translation of Object.values(card.translations || {})) {
      terms.push(translation.meaning, translation.explanation);
      for (const keyword of translation.keywords || []) terms.push(...(Array.isArray(keyword) ? keyword : [keyword]));
    }
    let best = 0;
    for (const term of terms.map(normalizeText).filter(Boolean)) {
      for (const piece of pieces) {
        if (piece.includes(term) || term.includes(piece)) best = Math.max(best, Math.min(piece.length, term.length) / Math.max(piece.length, term.length));
        else if (Math.min(piece.length, term.length) >= 4) best = Math.max(best, similarity(piece, term) * 0.75);
      }
    }
    if (best > 0.34) scores.set(card.category, Math.max(scores.get(card.category) || 0, best));
  }
  const top = [...scores].sort((a, b) => b[1] - a[1])[0];
  return top ? { id: top[0], confidence: Math.round(Math.min(0.92, top[1]) * 100) } : null;
}
