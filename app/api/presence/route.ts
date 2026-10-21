import { NextResponse } from 'next/server';
import { recordSitePresence } from '@/lib/site-presence';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const visitorsOnline = recordSitePresence(request);
  return NextResponse.json(
    { success: true, visitorsOnline, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

