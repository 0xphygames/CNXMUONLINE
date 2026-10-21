// Sessão assinada (HMAC-SHA256) para ações sensíveis, como a ocultação VIP.
// Formato do token: <accountId>.<expiraEmUnixSeg>.<assinatura>
// Sem SESSION_SECRET configurado, nenhum token é emitido nem aceito.

import crypto from 'crypto';

export const SESSION_COOKIE = 'mu_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ACCOUNT_RE = /^[A-Za-z0-9_]{1,10}$/;

function secret(): string | null {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url');
}

export function createSessionToken(accountId: string): string | null {
  const key = secret();
  if (!key || !ACCOUNT_RE.test(accountId)) return null;

  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `${accountId}.${exp}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  const key = secret();
  if (!key || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [accountId, expRaw, signature] = parts;
  const payload = `${accountId}.${expRaw}`;
  const expected = sign(payload, key);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  if (!ACCOUNT_RE.test(accountId)) return null;

  return accountId;
}
