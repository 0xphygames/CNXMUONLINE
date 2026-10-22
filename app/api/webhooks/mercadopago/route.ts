import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentDetails } from '@/lib/mercadopago';
import { MuDatabase } from '@/lib/db';

// Valida o cabeçalho x-signature (ts=...,v1=...) conforme o manual do Mercado Pago.
// Sem MERCADOPAGO_WEBHOOK_SECRET, nenhuma notificação é aceita.
function isSignatureValid(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signatureHeader = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!secret || !signatureHeader || !requestId) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => part.trim().split('=') as [string, string])
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    // Mercado Pago sends notifications in body or query parameters:
    // ?type=payment&data.id=12345678 or body: { action: 'payment.updated', data: { id: '...' } }
    const paymentId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    const topic = body?.type || body?.action || url.searchParams.get('topic') || url.searchParams.get('type');

    console.log(`[MercadoPago Webhook] Notificação recebida - Topic: ${topic}, ID: ${paymentId}`);

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID de pagamento ausente' },
        { status: 400 }
      );
    }

    if (!isSignatureValid(req, String(paymentId))) {
      return NextResponse.json(
        { success: false, message: 'Assinatura do webhook inválida' },
        { status: 401 }
      );
    }

    // Os dados do pagamento vêm sempre da API do Mercado Pago, nunca do corpo da requisição.
    const paymentData = await getPaymentDetails(String(paymentId));
    if (!paymentData) {
      // Sem confirmação do Mercado Pago não há crédito. 503 faz o Mercado Pago reenviar depois.
      return NextResponse.json(
        { success: false, message: 'Pagamento não confirmado pelo Mercado Pago' },
        { status: 503 }
      );
    }

    const status = paymentData.status;
    const membId = paymentData.external_reference;
    const amountBrl = Number(paymentData.transaction_amount || 0);

    if (!membId) {
      console.warn(`[MercadoPago Webhook] external_reference (memb___id) não identificado para payment ${paymentId}`);
      return NextResponse.json({ success: true, message: 'Sem conta associada' });
    }

    // 2. If payment is approved, credit WCoins via parameterized SQL
    if (status === 'approved') {
      // Calculate WCoins: check if transaction was already registered to get exact bonus wcoins
      const tx = await MuDatabase.getTransaction(String(paymentId));
      const wcoinToAdd = tx ? tx.wcoin_added : Math.floor(amountBrl * 100);

      // Execute SQL: UPDATE T_InGameShop_Point SET WCoinC = WCoinC + @wcoin WHERE memb___id = @memb_id
      await MuDatabase.addWCoinAndLogPayment(
        membId,
        wcoinToAdd,
        String(paymentId),
        amountBrl
      );

      console.log(
        `[MercadoPago Webhook] Pagamento APROVADO! +${wcoinToAdd} WCoins creditados para a conta '${membId}'`
      );

      return NextResponse.json({
        success: true,
        message: `WCoins creditados com sucesso para ${membId}`,
        wcoinsAdded: wcoinToAdd,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status do pagamento: ${status}`,
    });
  } catch (error) {
    console.error('[MercadoPago Webhook Error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
