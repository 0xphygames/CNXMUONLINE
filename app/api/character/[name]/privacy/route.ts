import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool } from '@/lib/db';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

const CHAR_NAME_RE = /^[A-Za-z0-9_]{1,10}$/;

// Ativa ou desativa o modo invisível de um personagem.
// Exige sessão assinada, posse do personagem e VIP ativo.
export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  const accountId = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!accountId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!CHAR_NAME_RE.test(name)) {
    return NextResponse.json({ success: false, error: 'Nome inválido' }, { status: 400 });
  }

  let body: { invisible?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Corpo inválido' }, { status: 400 });
  }
  if (typeof body.invisible !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Campo invisible é obrigatório' }, { status: 400 });
  }

  const pool = await getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Banco indisponível' }, { status: 503 });
  }

  try {
    // Confirma posse do personagem e VIP ativo, tudo no servidor.
    const check = await pool.request()
      .input('name', name)
      .input('acc', accountId)
      .query(`
        SELECT TOP 1 c.Name, v.VipUntil
        FROM dbo.Character c
        LEFT JOIN dbo.SiteVipAccount v ON v.AccountID = c.AccountID
        WHERE c.Name = @name AND c.AccountID = @acc
      `);

    const row = check.recordset[0];
    if (!row) {
      return NextResponse.json({ success: false, error: 'Personagem não pertence à conta' }, { status: 403 });
    }

    const vipActive = row.VipUntil && new Date(row.VipUntil).getTime() > Date.now();
    if (!vipActive) {
      return NextResponse.json({ success: false, error: 'Recurso exclusivo para VIP' }, { status: 403 });
    }

    await pool.request()
      .input('name', name)
      .input('acc', accountId)
      .input('inv', sql.Bit, body.invisible ? 1 : 0)
      .query(`
        MERGE dbo.SiteCharPrivacy AS target
        USING (SELECT @name AS CharName) AS source
        ON target.CharName = source.CharName
        WHEN MATCHED THEN
          UPDATE SET Invisible = @inv, UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (CharName, AccountID, Invisible) VALUES (@name, @acc, @inv);
      `);

    return NextResponse.json({ success: true, data: { name, invisible: body.invisible } });
  } catch (error) {
    console.error('[privacy] falhou:', (error as Error).message);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar privacidade' }, { status: 500 });
  }
}
