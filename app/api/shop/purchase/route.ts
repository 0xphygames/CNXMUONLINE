import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const account = req.cookies.get('mu_session_user')?.value;
    if (!account) return NextResponse.json({ success: false, message: 'Faça login para comprar.' }, { status: 401 });
    const body = await req.json();
    const productId = Number(body.productId);
    const quantity = Number(body.quantity || 1);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ success: false, message: 'Produto ou quantidade inválida.' }, { status: 400 });
    }
    const result = await MuDatabase.purchaseWebShopProduct(account.trim().toLowerCase(), productId, quantity, body.characterName);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 400 });
  }
}

