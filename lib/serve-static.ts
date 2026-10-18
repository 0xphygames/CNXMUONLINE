import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Tipos de arquivo servidos pelas rotas de patch e download.
const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ini': 'text/plain; charset=utf-8',
  '.exe': 'application/octet-stream',
  '.dll': 'application/octet-stream',
};

// Entrega um arquivo de `root`, impedindo sair da pasta (ex.: ../../).
export async function serveFile(root: string, segments: string[]): Promise<Response> {
  const base = path.resolve(root);
  const target = path.resolve(base, ...segments);
  if (!target.startsWith(base + path.sep)) {
    return new Response('Not found', { status: 404 });
  }

  let stat;
  try {
    stat = await fs.stat(target);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  if (!stat.isFile()) {
    return new Response('Not found', { status: 404 });
  }

  const stream = Readable.toWeb(createReadStream(target)) as unknown as ReadableStream;
  return new Response(stream, {
    headers: {
      'Content-Type': CONTENT_TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-cache',
    },
  });
}

// Pasta de arquivos publicos (public_html da conta na Hostinger).
// PUBLIC_FILES_DIR sobrescreve o padrao, se estiver definida.
const DEFAULT_PUBLIC_DIR = '/home/u251218147/domains/navajowhite-badger-724362.hostingersite.com/public_html';

export function publicFilesDir(sub: 'patch' | 'download'): string {
  return path.join(process.env.PUBLIC_FILES_DIR || DEFAULT_PUBLIC_DIR, sub);
}
