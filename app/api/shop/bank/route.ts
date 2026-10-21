
import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { decodeStorageItems } from '@/lib/char-equipment';

export async function GET(req: NextRequest) {
  const account = req.cookies.get('mu_session_user')?.value;
  if (!account) return NextResponse.json({ success: false, message: 'Faça login.' }, { status: 401 });
  const username = account.trim().toLowerCase();
  const [warehouse, virtual] = await Promise.all([
    MuDatabase.getGameWarehouse(username),
    MuDatabase.getVirtualBankItems(username),
  ]);
  const gameItems = warehouse ? decodeStorageItems(new Uint8Array(warehouse), 'warehouse') : [];
  const virtualItems = virtual.flatMap((item) => decodeStorageItems(new Uint8Array(item.ItemData), 'virtual', Number(item.VirtualItemID)));
  return NextResponse.json({ success: true, warehouse: gameItems, virtual: virtualItems });
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

