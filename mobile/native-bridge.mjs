import { Capacitor } from '@capacitor/core';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { chooseAdaptiveMatch, matchCatalog, normalizeText, recognizedPieces, suggestCategory } from '../recognition-core.mjs';

const LEARNING_KEY = 'sign-by-sign-ai-learning-v1';
const COMMUNITY_KEY = 'sign-by-sign-community-v1';

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value && typeof value === 'object' ? value : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function learningState() {
  return readJson(LEARNING_KEY, { aliases: {}, feedbackCount: 0, lastFeedbackAt: 0 });
}

function communityState() {
  return readJson(COMMUNITY_KEY, { queue: [], publishedCards: [], version: 0, lastSyncAt: 0, lastSyncStatus: 'offline' });
}

function safeImagePath(value) {
  return typeof value === 'string' && (
    /^assets\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp)$/.test(value) ||
    /^https:\/\/raw\.githubusercontent\.com\/qwon4466\/mid-term\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp)$/.test(value)
  );
}

function validPublishedCard(card) {
  const translation = card && card.translations;
  const guide = card && card.travelGuide;
  return !!(card && /^[a-z0-9-]{1,64}$/.test(card.id) &&
    typeof card.korean === 'string' && card.korean.length > 0 && card.korean.length <= 120 &&
    typeof card.category === 'string' && typeof card.subcategory === 'string' &&
    Array.isArray(card.aliases) && card.aliases.length > 0 && card.aliases.every(alias => typeof alias === 'string' && alias.length <= 120) &&
    safeImagePath(card.image) && safeImagePath(card.portrait) &&
    Array.isArray(card.images) && card.images.some(image => image.role === 'primary') &&
    card.images.every(image => image && safeImagePath(image.path) && safeImagePath(image.portrait) && typeof image.kind === 'string') &&
    translation && ['ko', 'en', 'ja'].every(language => translation[language] && typeof translation[language].meaning === 'string' && typeof translation[language].explanation === 'string' && Array.isArray(translation[language].keywords)) &&
    guide && guide.experience && ['ko', 'en', 'ja'].every(language => typeof guide.experience[language] === 'string') &&
    Array.isArray(guide.phrases) && guide.phrases.every(phrase => phrase && typeof phrase.korean === 'string' && typeof phrase.romanization === 'string' && phrase.meaning && ['ko', 'en', 'ja'].every(language => typeof phrase.meaning[language] === 'string')));
}

function learnedMatch(cards, input) {
  const learned = learningState();
  const pieces = recognizedPieces(input.text);
  const records = pieces.map(piece => learned.aliases[piece]).filter(Boolean).sort((a, b) => b.confirmations - a.confirmations || b.updatedAt - a.updatedAt);
  if (!records.length) return null;
  const record = records[0];
  const card = cards.find(item => item.id === record.cardId);
  if (!card) return null;
  const reliable = input.source === 'manual' || Number(input.confidence) >= 75;
  const candidate = { id: card.id, alias: record.displayText, kind: 'learned', score: Math.min(1, 0.9 + record.confirmations * 0.02), category: card.category, scope: 'learned' };
  return {
    status: reliable ? 'matched' : 'candidates',
    matchedId: reliable ? card.id : null,
    candidates: [candidate],
    scope: reliable ? 'learned' : null,
    requiresConfirmation: !reliable,
    learned: true
  };
}

async function photoFile(source) {
  const result = await Camera.getPhoto({
    source,
    direction: CameraDirection.Rear,
    resultType: CameraResultType.Uri,
    quality: 90,
    width: 2200,
    correctOrientation: true,
    saveToGallery: false,
    promptLabelHeader: '간판 사진',
    promptLabelPhoto: '사진에서 선택',
    promptLabelPicture: '카메라로 촬영'
  });
  if (!result.webPath) throw new Error('Camera did not return an image.');
  const response = await fetch(result.webPath);
  const blob = await response.blob();
  return new File([blob], `sign-${Date.now()}.${result.format || 'jpeg'}`, { type: blob.type || `image/${result.format || 'jpeg'}` });
}

function reinforce({ text, cardId, corrected = false }) {
  const normalized = normalizeText(text);
  if (!normalized || !cardId) return getLearningStats();
  const state = learningState();
  const previous = state.aliases[normalized];
  state.aliases[normalized] = {
    cardId,
    displayText: String(text).trim().slice(0, 120),
    confirmations: previous && previous.cardId === cardId ? previous.confirmations + 1 : 1,
    corrections: (previous && previous.corrections || 0) + (corrected ? 1 : 0),
    updatedAt: Date.now()
  };
  state.feedbackCount = (state.feedbackCount || 0) + 1;
  state.lastFeedbackAt = Date.now();
  writeJson(LEARNING_KEY, state);
  return getLearningStats();
}

function getLearningStats() {
  const learned = learningState();
  const community = communityState();
  return {
    learnedAliases: Object.keys(learned.aliases || {}).length,
    feedbackCount: learned.feedbackCount || 0,
    pendingContributions: (community.queue || []).filter(item => item.status === 'pending').length,
    publishedCards: (community.publishedCards || []).length,
    catalogVersion: community.version || 0,
    lastSyncAt: community.lastSyncAt || 0,
    lastSyncStatus: community.lastSyncStatus || 'offline'
  };
}

function queueContribution(input) {
  const state = communityState();
  const item = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    status: 'pending',
    ocrText: String(input.ocrText || '').trim().slice(0, 500),
    storeName: String(input.storeName || '').trim().slice(0, 120),
    category: String(input.category || '').slice(0, 80),
    description: String(input.description || '').trim().slice(0, 800),
    photoData: String(input.photoData || '').slice(0, 600000),
    consent: input.consent === true
  };
  if (!item.storeName || !item.category || !item.consent) throw new Error('Name, category and consent are required.');
  state.queue = [item, ...(state.queue || [])].slice(0, 20);
  writeJson(COMMUNITY_KEY, state);
  return item;
}

async function syncCommunity() {
  const state = communityState();
  const config = globalThis.SignBySignConfig || {};
  let published = null;
  let remoteCatalogLoaded = false;
  try {
    if (config.communityCatalogUrl) {
      try {
        const response = await fetch(config.communityCatalogUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Catalog ${response.status}`);
        published = await response.json();
        remoteCatalogLoaded = true;
      } catch (_) { /* Keep the bundled catalog available offline. */ }
    }
    if (!published) {
      const response = await fetch('./data/community-catalog.json', { cache: 'no-store' });
      if (response.ok) published = await response.json();
    }
    if (published && Array.isArray(published.cards)) {
      state.publishedCards = published.cards.filter(validPublishedCard);
      state.version = Number(published.version) || state.version || 0;
    }

    if (config.communitySubmitUrl) {
      for (const item of state.queue.filter(entry => entry.status === 'pending')) {
        const response = await fetch(config.communitySubmitUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
        if (!response.ok) throw new Error(`Contribution ${response.status}`);
        item.status = 'submitted';
        item.submittedAt = Date.now();
      }
    }
    state.lastSyncAt = Date.now();
    state.lastSyncStatus = remoteCatalogLoaded ? 'ok' : 'bundled';
  } catch (error) {
    state.lastSyncAt = Date.now();
    state.lastSyncStatus = 'offline';
    writeJson(COMMUNITY_KEY, state);
    throw error;
  }
  writeJson(COMMUNITY_KEY, state);
  return getLearningStats();
}

function getPublishedCards() {
  return communityState().publishedCards || [];
}

function getContributionQueue() {
  return communityState().queue || [];
}

globalThis.SignNative = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),
  takePhoto: () => photoFile(CameraSource.Camera),
  choosePhoto: () => photoFile(CameraSource.Photos),
  match(cards, input) {
    const result = chooseAdaptiveMatch(matchCatalog(cards, input), learnedMatch(cards, input));
    result.suggestedCategory = suggestCategory(cards, input.text);
    result.engine = 'on-device-ocr-adaptive-v1';
    return result;
  },
  reinforce,
  queueContribution,
  syncCommunity,
  getLearningStats,
  getPublishedCards,
  getContributionQueue
};

globalThis.dispatchEvent(new CustomEvent('signnative-ready', { detail: { platform: Capacitor.getPlatform() } }));
