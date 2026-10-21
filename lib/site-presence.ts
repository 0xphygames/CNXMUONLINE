import crypto from 'crypto';

const VISITOR_TTL_MS = 5 * 60 * 1000;
const visitors = new Map<string, number>();

function getVisitorAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function getSecret(): string {
  return process.env.PRESENCE_SECRET || process.env.SESSION_SECRET || 'development-presence-secret';
}

function visitorKey(request: Request): string {
  return crypto.createHmac('sha256', getSecret()).update(getVisitorAddress(request)).digest('hex');
}

export function recordSitePresence(request: Request): number {
  const now = Date.now();
  visitors.set(visitorKey(request), now);

  for (const [key, lastSeen] of visitors) {
    if (now - lastSeen > VISITOR_TTL_MS) visitors.delete(key);
  }

  return visitors.size;
}

