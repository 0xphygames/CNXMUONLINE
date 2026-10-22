import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID de pagamento não informado.' },
        { status: 400 }
      );
    }

    const tx = await MuDatabase.getTransaction(paymentId);

    if (!tx) {
      return NextResponse.json(
        { success: false, message: 'Transação não encontrada.' },
        { status: 404 }
      );
    }

    const currentPoints = await MuDatabase.getShopPoints(tx.memb___id);

    return NextResponse.json({
      success: true,
      transaction: tx,
      shopPoints: currentPoints,
      isApproved: tx.status === 'approved',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
