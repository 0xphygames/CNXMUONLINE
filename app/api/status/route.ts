import { NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { calculateEventTimers } from '@/lib/events';

export async function GET() {
  try {
    const stats = await MuDatabase.getServerStats();
    const eventTimers = calculateEventTimers();

    return NextResponse.json({
      success: true,
      site: { status: 'online' as const },
      game: {
        status: stats.onlinePlayersSource === 'sql' ? 'online' : 'unknown',
        playersOnline: stats.onlinePlayersSource === 'sql' ? stats.onlinePlayers : null,
      },
      stats,
      events: eventTimers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
