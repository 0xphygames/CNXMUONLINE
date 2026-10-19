import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const account = req.cookies.get('mu_session_user')?.value;
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, items: await MuDatabase.getWebShopChest(account.trim().toLowerCase()) });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

