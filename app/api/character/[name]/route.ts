import { NextRequest, NextResponse } from 'next/server';
import sql from 'mssql';
import { getDbPool } from '@/lib/db';
import { decodeEquipment } from '@/lib/char-equipment';

// Nome de personagem MU: 1 a 10 caracteres, letras, números e underscore.
const CHAR_NAME_RE = /^[A-Za-z0-9_]{1,10}$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  if (!CHAR_NAME_RE.test(name)) {
    return NextResponse.json({ success: false, error: 'Nome inválido' }, { status: 400 });
  }

  const pool = await getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Banco indisponível' }, { status: 503 });
  }

  try {
    const request = pool.request();
    request.input('name', name);

    const result = await request.query(`
      SELECT TOP 1
        c.Name,
        c.AccountID,
        c.cLevel,
        c.Class,
        c.ResetCount,
        c.MasterResetCount,
        c.MapNumber,
        c.Strength, c.Dexterity, c.Vitality, c.Energy, c.Leadership,
        c.Inventory,
        gm.G_Name AS GuildName,
        ms.ConnectStat,
        sp.Invisible
      FROM dbo.Character c
      LEFT JOIN dbo.GuildMember gm ON gm.Name = c.Name
      LEFT JOIN dbo.MEMB_STAT ms ON ms.memb___id = c.AccountID
      LEFT JOIN dbo.SiteCharPrivacy sp ON sp.CharName = c.Name
      WHERE c.Name = @name
    `);

    const row = result.recordset[0];
    if (!row) {
      return NextResponse.json({ success: false, error: 'Personagem não encontrado' }, { status: 404 });
    }

    const hidden = row.Invisible === true;

    // Campos sempre públicos (identidade e ranking).
    const publicData = {
      name: row.Name,
      class: row.Class,
      level: row.cLevel,
      resets: row.ResetCount,
      grandResets: row.MasterResetCount,
      guild: hidden ? null : row.GuildName ?? null,
      hidden,
    };

    if (hidden) {
      // Modo invisível: sem atributos, mapa, status online nem equipamentos.
      return NextResponse.json({ success: true, data: publicData });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...publicData,
        attributes: {
          strength: row.Strength,
          agility: row.Dexterity,
          vitality: row.Vitality,
          energy: row.Energy,
          command: row.Leadership,
        },
        map: row.MapNumber,
        online: row.ConnectStat === 1,
        // Somente equipamentos equipados. Inventário e armazém nunca são retornados.
        equipment: decodeEquipment(new Uint8Array(row.Inventory ?? [])),
      },
    });
  } catch (error) {
    console.error('[character] consulta falhou:', (error as Error).message);
    return NextResponse.json({ success: false, error: 'Erro ao consultar personagem' }, { status: 500 });
  }
}
