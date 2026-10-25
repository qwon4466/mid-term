import { createHash, randomUUID } from 'node:crypto';

const CLIENT_PATTERN = /^[a-zA-Z0-9._:-]{8,120}$/;

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

export function createSupportRequest(db, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid support request.');
  const type = clean(input.type, 16);
  const email = clean(input.email, 160);
  const message = clean(input.message, 2000);
  const context = clean(typeof input.context === 'string' ? input.context : JSON.stringify(input.context || {}), 1200);
  const clientId = clean(input.clientId, 120);
  if (!['report', 'inquiry'].includes(type) || message.length < 5 || !CLIENT_PATTERN.test(clientId)) throw new TypeError('Type, message and anonymous client id are required.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new TypeError('Email address is invalid.');
  const id = randomUUID();
  const clientHash = createHash('sha256').update(`${process.env.COMMUNITY_HASH_PEPPER || 'sign-by-sign-local'}:${clientId}`).digest('hex');
  db.prepare('INSERT INTO support_requests (id,created_at,type,email,message,context,client_hash,status) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, Date.now(), type, email, message, context, clientHash, 'open');
  return { id, type, createdAt: Date.now(), status: 'open' };
}
