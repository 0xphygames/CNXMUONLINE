
import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const account = req.cookies.get('mu_session_user')?.value;
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  return NextResponse.json({ success: true, items: await MuDatabase.getVirtualBankItems(account.trim().toLowerCase()) });
}

export async function POST(req: NextRequest) {
  const account = req.cookies.get('mu_session_user')?.value;
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    const { action, slot, virtualItemId } = await req.json();
    const username = account.trim().toLowerCase();
    if (action === 'deposit') {
      const id = await MuDatabase.depositWarehouseItem(username, Number(slot));
      return NextResponse.json({ success: true, virtualItemId: id });
    }
    if (action === 'withdraw') {
      const targetSlot = await MuDatabase.withdrawVirtualBankItem(username, Number(virtualItemId));
      return NextResponse.json({ success: true, slot: targetSlot });
    }
    return NextResponse.json({ success: false, message: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 });
  }
}

