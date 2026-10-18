import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = (searchParams.get('type') || 'resets') as 'resets' | 'resets_daily' | 'resets_weekly' | 'resets_monthly' | 'level' | 'master' | 'guilds' | 'siege';
    const classCodes = (searchParams.get('classes') || '')
      .split(',')
      .filter((value) => /^\d+$/.test(value))
      .map(Number)
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 3);

    const rankings = await MuDatabase.getRankings(type, classCodes.length ? classCodes : undefined);

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

