import { NextRequest, NextResponse } from 'next/server';
import { MuDatabase } from '@/lib/db';
import { getSessionAccount } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    // Identidade somente pela sessão assinada; o parâmetro `username` não é aceito.
    const username = getSessionAccount(req);

    if (!username) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const cleanUser = String(username).trim().toLowerCase();
    const account = await MuDatabase.findAccount(cleanUser);

    if (!account) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const [characters, shopPoints] = await Promise.all([
      MuDatabase.getUserCharacters(cleanUser),
      MuDatabase.getShopPoints(cleanUser),
    ]);

    return NextResponse.json({
      authenticated: true,
      user: {
        username: account.memb___id,
        email: account.mail_addr,
        status: account.bloc_code === '0' ? 'Ativa' : 'Bloqueada',
        shopPoints,
        characters,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { authenticated: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
