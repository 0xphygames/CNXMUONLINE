
import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { decodeStorageItems } from '@/lib/char-equipment';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

// Identidade vem só da sessão assinada. O cookie antigo mu_session_user não é confiável.
function sessionAccount(req: NextRequest): string | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function GET(req: NextRequest) {
  const account = sessionAccount(req);
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    const username = account.toLowerCase();
    const [warehouse, virtual] = await Promise.all([
      MuDatabase.getGameWarehouse(username),
      MuDatabase.getVirtualBankItems(username),
    ]);
    const gameItems = warehouse ? decodeStorageItems(new Uint8Array(warehouse), 'warehouse') : [];
    const virtualItems = virtual.flatMap((item) => decodeStorageItems(new Uint8Array(item.ItemData), 'virtual', Number(item.VirtualItemID)).map((decoded) => ({ ...decoded, slot: Number(item.SourceSlot) })));
    return NextResponse.json({ success: true, warehouse: gameItems, virtual: virtualItems });
  } catch (error) {
    console.error('[bank GET] falhou:', (error as Error).message);
    return NextResponse.json({ success: false, message: 'Não foi possível carregar o armazém.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const account = sessionAccount(req);
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  try {
    const { action, slot, virtualItemId } = await req.json();
    const username = account.toLowerCase();
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

