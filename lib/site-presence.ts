import crypto from 'crypto';

const VISITOR_TTL_MS = 90 * 1000;
const visitors = new Map<string, number>();

function getSecret(): string {
  return process.env.PRESENCE_SECRET || process.env.SESSION_SECRET || 'development-presence-secret';
}

function visitorKey(request: Request): string | null {
  const sessionId = request.headers.get('x-site-presence-id')?.trim();
  if (!sessionId || sessionId.length < 16 || sessionId.length > 128) return null;
  return crypto.createHmac('sha256', getSecret()).update(sessionId).digest('hex');
}

export function recordSitePresence(request: Request): number {
  const now = Date.now();
  const key = visitorKey(request);
  if (key) visitors.set(key, now);

  for (const [key, lastSeen] of visitors) {
    if (now - lastSeen > VISITOR_TTL_MS) visitors.delete(key);
  }

  return visitors.size;
}

