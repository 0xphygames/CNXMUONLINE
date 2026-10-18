import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'resets') as 'resets' | 'resets_daily' | 'resets_weekly' | 'resets_monthly' | 'level' | 'master' | 'guilds' | 'siege';

    const rankings = await MuDatabase.getRankings(type);

    return NextResponse.json({
      success: true,
      category: type,
      data: rankings,
      count: rankings.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
