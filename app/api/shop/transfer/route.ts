import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { getSessionAccount } from '@/lib/session';

export async function POST(req: NextRequest) {
  const account = getSessionAccount(req);
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    const { deliveryId } = await req.json();
    if (!Number.isInteger(Number(deliveryId))) throw new Error('Entrega inválida.');
    await MuDatabase.claimWebShopDelivery(account.trim().toLowerCase(), Number(deliveryId));
    return NextResponse.json({ success: true, message: 'Item confirmado no CashShop e enviado para o jogo.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 });
  }
}

