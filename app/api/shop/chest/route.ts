import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { getSessionAccount } from '@/lib/session';

export async function GET(req: NextRequest) {
  const account = getSessionAccount(req);
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, items: await MuDatabase.getWebShopChest(account.trim().toLowerCase()) });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

